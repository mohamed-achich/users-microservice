import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should successfully create a new user', async () => {
      const user = {
        id: '1',
        ...createUserDto,
        roles: [UserRole.USER],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(user);
      mockRepository.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.username).toBe(createUserDto.username);
      expect(result.email).toBe(createUserDto.email);
      expect(result.password).toBeUndefined();
      expect(result.roles).toContain(UserRole.USER);
    });

    it('should throw RpcException if username already exists', async () => {
      mockRepository.findOne.mockResolvedValue({ username: createUserDto.username });

      await expect(service.create(createUserDto))
        .rejects
        .toThrow(new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Username already exists'
        }));
    });

    it('should throw RpcException if password is too short', async () => {
      const invalidDto = { ...createUserDto, password: '12345' };
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.create(invalidDto))
        .rejects
        .toThrow(new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Password must be at least 6 characters long'
        }));
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const users = [
        {
          id: '1',
          username: 'user1',
          email: 'user1@example.com',
          password: 'hashedpass',
          roles: [UserRole.USER],
        },
        {
          id: '2',
          username: 'user2',
          email: 'user2@example.com',
          password: 'hashedpass',
          roles: [UserRole.USER],
        },
      ];

      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      result.forEach(user => {
        expect(user.password).toBeUndefined();
      });
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const user = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpass',
        roles: [UserRole.USER],
        isActive: true,
      };

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.password).toBeUndefined();
    });

    it('should throw RpcException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1'))
        .rejects
        .toThrow(new RpcException({
          code: status.NOT_FOUND,
          message: 'User with ID 1 not found or inactive'
        }));
    });
  });

  describe('findByUsername', () => {
    it('should return a user if found by username', async () => {
      const user = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpass',
        roles: [UserRole.USER],
      };

      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByUsername('testuser');

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.password).toBeUndefined();
    });

    it('should throw RpcException if username not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUsername('nonexistent'))
        .rejects
        .toThrow(new RpcException({
          code: status.NOT_FOUND,
          message: 'User with username nonexistent not found'
        }));
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should successfully update a user', async () => {
      const existingUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpass',
        roles: [UserRole.USER],
        isActive: true,
      };

      const updatedUser = { ...existingUser, ...updateUserDto };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', updateUserDto);

      expect(result).toBeDefined();
      expect(result.firstName).toBe(updateUserDto.firstName);
      expect(result.lastName).toBe(updateUserDto.lastName);
      expect(result.password).toBeUndefined();
    });

    it('should throw RpcException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', updateUserDto))
        .rejects
        .toThrow(new RpcException({
          code: status.NOT_FOUND,
          message: 'User with ID 1 not found or inactive'
        }));
    });
  });

  describe('remove', () => {
    it('should successfully remove a user', async () => {
      const user = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        roles: [UserRole.USER],
      };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('1')).resolves.not.toThrow();
      expect(mockRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw RpcException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('1'))
        .rejects
        .toThrow(new RpcException({
          code: status.NOT_FOUND,
          message: 'User with ID 1 not found or inactive'
        }));
    });
  });
});
