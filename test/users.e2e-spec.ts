import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../src/users/users.module';
import { User as UserEntity } from '../src/users/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport, ClientGrpc } from '@nestjs/microservices';
import { join } from 'path';
import { firstValueFrom, Observable } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { v4 as uuidv4 } from 'uuid';

// Proto interfaces
interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface UpdateUserRequest {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}

interface UserById {
  id: string;
}


interface UsersServiceClient {
  create(data: CreateUserRequest): Observable<User>;
  findOne(data: UserById): Observable<User>;
  update(data: UpdateUserRequest): Observable<User>;
  delete(data: UserById): Observable<{}>;
}

describe('UsersService (e2e)', () => {
  let app: INestApplication;
  let client: UsersServiceClient;
  let createdUsers: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('POSTGRES_HOST'),
            port: configService.get('POSTGRES_PORT'),
            username: configService.get('POSTGRES_USER'),
            password: configService.get('POSTGRES_PASSWORD'),
            database: configService.get('POSTGRES_DB'),
            entities: [UserEntity],
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        ClientsModule.register([
          {
            name: 'USERS_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'users',
              protoPath: join(__dirname, '../src/users.proto'),
              url: 'localhost:5052',
            },
          },
        ]),
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.connectMicroservice({
      transport: Transport.GRPC,
      options: {
        package: 'users',
        protoPath: join(__dirname, '../src/users.proto'),
        url: '0.0.0.0:5052',
      },
    });

    await app.startAllMicroservices();
    await app.init();

    const grpcClient = app.get<ClientGrpc>('USERS_PACKAGE');
    client = grpcClient.getService<UsersServiceClient>('UsersService');
  });

  afterAll(async () => {
    // Clean up all created users
    for (const userId of createdUsers) {
      try {
        await firstValueFrom<{}>(client.delete({ id: userId }));
      } catch (error) {
        console.error(`Failed to clean up user ${userId}:`, error);
      }
    }
    await app.close();
  });

  describe('Create User', () => {
    const createUserDto: CreateUserRequest = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should create a new user', async () => {
      const response = await firstValueFrom<User>(client.create(createUserDto));
      expect(response).toBeDefined();
      expect(response.username).toBe(createUserDto.username);
      expect(response.email).toBe(createUserDto.email);
      expect(response.firstName).toBe(createUserDto.firstName);
      expect(response.lastName).toBe(createUserDto.lastName);
      expect(response.roles).toEqual(['USER']);
      expect(response.isActive).toBe(true);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
      createdUsers.push(response.id);
    });

    it('should fail to create user with existing username', async () => {
      try {
        await firstValueFrom<User>(client.create(createUserDto));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(status.ALREADY_EXISTS);
      }
    });

    it('should fail to create user with invalid password', async () => {
      const invalidUser: CreateUserRequest = { 
        ...createUserDto, 
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: '123' 
      };
      try {
        await firstValueFrom<User>(client.create(invalidUser));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(status.INVALID_ARGUMENT);
      }
    });
  });

  describe('Find Users', () => {
    let testUser: User;

    beforeAll(async () => {
      testUser = await firstValueFrom<User>(client.create({
        username: `finduser_${Date.now()}`,
        email: `find_${Date.now()}@example.com`,
        password: 'Test123!',
        firstName: 'Find',
        lastName: 'User'
      }));
      createdUsers.push(testUser.id);
    });



    it('should find a user by id', async () => {
      const response = await firstValueFrom<User>(client.findOne({ id: testUser.id }));
      expect(response).toBeDefined();
      expect(response.id).toBe(testUser.id);
      expect(response.username).toBe(testUser.username);
      expect(response.email).toBe(testUser.email);
      expect(response.firstName).toBe(testUser.firstName);
      expect(response.lastName).toBe(testUser.lastName);
      expect(response.roles).toEqual(['USER']);
      expect(response.isActive).toBe(true);
    });

    it('should fail to find non-existent user', async () => {
      const nonExistentId = uuidv4();
      try {
        await firstValueFrom<User>(client.findOne({ id: nonExistentId }));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(status.NOT_FOUND);
      }
    });
  });

  describe('Update User', () => {
    let testUser: User;

    beforeAll(async () => {
      testUser = await firstValueFrom<User>(client.create({
        username: `updateuser_${Date.now()}`,
        email: `update_${Date.now()}@example.com`,
        password: 'Test123!',
        firstName: 'Update',
        lastName: 'User'
      }));
      createdUsers.push(testUser.id);
    });

    it('should update user details', async () => {
      const updateData: UpdateUserRequest = {
        id: testUser.id,
        firstName: 'John',
        lastName: 'Doe',
        email: `updated_${Date.now()}@example.com`
      };

      const response = await firstValueFrom<User>(client.update(updateData));
      expect(response.firstName).toBe(updateData.firstName);
      expect(response.lastName).toBe(updateData.lastName);
      expect(response.email).toBe(updateData.email);
      expect(response.roles).toEqual(['USER']);
      expect(response.isActive).toBe(true);
      expect(response.createdAt).toBeDefined();
      expect(response.updatedAt).toBeDefined();
    });

    it('should fail when updating non-existent user', async () => {
      const nonExistentId = uuidv4();
      try {
        await firstValueFrom<User>(client.update({
          id: nonExistentId,
          firstName: 'John',
        }));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(status.NOT_FOUND);
      }
    });
  });

  describe('Delete User', () => {
    let testUser: User;

    beforeAll(async () => {
      testUser = await firstValueFrom<User>(client.create({
        username: `deleteuser_${Date.now()}`,
        email: `delete_${Date.now()}@example.com`,
        password: 'Test123!',
        firstName: 'Delete',
        lastName: 'User'
      }));
      createdUsers.push(testUser.id);
    });

    it('should delete a user', async () => {
      const response = await firstValueFrom<{}>(client.delete({ id: testUser.id }));
      expect(response).toBeDefined();

      // Verify user is deleted
      try {
        await firstValueFrom<User>(client.findOne({ id: testUser.id }));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(status.NOT_FOUND);
      }
    });

    it('should fail when deleting non-existent user', async () => {
      const nonExistentId = uuidv4();
      try {
        await firstValueFrom<{}>(client.delete({ id: nonExistentId }));
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe(status.NOT_FOUND);
      }
    });
  });
});
