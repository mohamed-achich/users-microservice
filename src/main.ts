import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';

async function bootstrap() {
  // Create the main gRPC application
  const grpcApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'users',
      protoPath: join(__dirname, './users.proto'),
      url: '0.0.0.0:5052'
    },
  });

  // Create a separate HTTP application just for health checks
  const httpApp = await NestFactory.create(AppModule);
  httpApp.useGlobalPipes(new ValidationPipe());
  httpApp.enableCors();
  await httpApp.listen(5002);

  // Start the gRPC service
  await grpcApp.listen();
  
  console.log('Users microservice is listening via gRPC on port 5052');
  console.log('Health check endpoint available on port 5002');
}

bootstrap();
