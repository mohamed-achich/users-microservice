import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class UsersService {
 private readonly saltLength = 32;
 private readonly keyLength = 64;
 
 constructor(
   @InjectRepository(User)
   private readonly usersRepository: Repository<User>,
 ) {}
 
 private async hashPassword(password: string): Promise<string> {
   const salt = crypto.randomBytes(this.saltLength);
   const scryptAsync = promisify(crypto.scrypt);
   
   const derivedKey = await scryptAsync(password, salt, this.keyLength) as Buffer;
   return salt.toString('hex') + ':' + derivedKey.toString('hex');
 }
 
 private async verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
   const [salt, key] = storedPassword.split(':');
   const saltBuffer = Buffer.from(salt, 'hex');
   const keyBuffer = Buffer.from(key, 'hex');
   
   const scryptAsync = promisify(crypto.scrypt);
   const derivedKey = await scryptAsync(suppliedPassword, saltBuffer, this.keyLength) as Buffer;
   
   return crypto.timingSafeEqual(keyBuffer, derivedKey);
 }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Normalize email and username
      createUserDto.email = createUserDto.email.toLowerCase().trim();
      createUserDto.username = createUserDto.username.toLowerCase().trim();

      const existingUser = await this.usersRepository.findOne({
        where: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      });

      if (existingUser) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: existingUser.username === createUserDto.username
            ? 'Username already exists'
            : 'Email already exists'
        });
      }

      // Validate password strength
      if (createUserDto.password.length < 6) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Password must be at least 6 characters long'
        });
      }

      const hashedPassword = await this.hashPassword(createUserDto.password);
      const user = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
        roles: [UserRole.USER],
        isActive: true,
      });

      const savedUser = await this.usersRepository.save(user);
      const { password: _, ...result } = savedUser;
      return result as User;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create user'
      });
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users.map(user => {
      const { password: _, ...result } = user;
      return result as User;
    });
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({ 
        where: { 
          id,
          isActive: true 
        } 
      });
      
      if (!user) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: `User with ID ${id} not found or inactive`
        });
      }
      
      const { password: _, ...result } = user;
      return result as User;
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      console.error('Error finding user:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to find user'
      });
    }
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `User with username ${username} not found`
      });
    }
    const { password: _, ...result } = user;
    return result as User;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `User with email ${email} not found`
      });
    }
    const { password: _, ...result } = user;
    return result as User;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);
    const { password: _, ...result } = updatedUser;
    return result as User;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async validateCredentials(username: string, password: string): Promise<{ isValid: boolean; user?: any }> {
    try {
      const user = await this.usersRepository.findOne({ where: { username } });
      if (!user || !user.isActive) {
        return { isValid: false };
      }

      const isValid = await this.verifyPassword(user.password, password);
      if (!isValid) {
        return { isValid: false };
      }

      const { password: _, ...result } = user;
      return { isValid: true, user: result };
    } catch (error) {
      console.error('Error validating credentials:', error);
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to validate credentials'
      });
    }
  }
}
