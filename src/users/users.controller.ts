import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

interface UserById {
  id: string;
}

interface UserByUsername {
  username: string;
}

interface ValidateCredentialsRequest {
  username: string;
  password: string;
}

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UsersService', 'ValidateCredentials')
  async validateCredentials(data: ValidateCredentialsRequest) {
    return this.usersService.validateCredentials(data.username, data.password);
  }

  @GrpcMethod('UsersService', 'FindOne')
  async findOneGrpc(data: UserById) {
    try {
      return await this.usersService.findOne(data.id);
    } catch (error) {
      console.error('Error in findOne:', error);
      throw error;
    }
  }

  @GrpcMethod('UsersService', 'FindByUsername')
  async findByUsernameGrpc(data: UserByUsername) {
    try {
      return await this.usersService.findByUsername(data.username);
    } catch (error) {
      console.error('Error in findByUsername:', error);
      throw error;
    }
  }

  @GrpcMethod('UsersService', 'Create')
  async createGrpc(data: CreateUserDto) {
    try {
      return await this.usersService.create(data);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  @GrpcMethod('UsersService', 'Update')
  async updateGrpc(data: { id: string } & UpdateUserDto) {
    try {
      return await this.usersService.update(data.id, data);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  @GrpcMethod('UsersService', 'Delete')
  async deleteGrpc(data: UserById) {
    try {
      await this.usersService.remove(data.id);
      return {};
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}
