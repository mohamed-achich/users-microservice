# Users Microservice

[![CI/CD](https://github.com/mohamed-achich/users-microservice/actions/workflows/ci.yaml/badge.svg)](https://github.com/mohamed-achich/users-microservice/actions/workflows/ci.yaml)

Part of the [E-commerce Platform](https://github.com/mohamed-achich/ecommerce-deployment) microservices architecture.

## Overview

A microservice responsible for user management and authentication in the e-commerce system. Built with NestJS and PostgreSQL, it provides gRPC endpoints for user operations and authentication services.

## Features

- User CRUD operations
- Authentication and authorization
- Role-based access control
- Password hashing and validation
- PostgreSQL integration with TypeORM
- gRPC server implementation
- Service-to-service authentication
- Health checks

## Technical Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Communication**: gRPC
- **Authentication**: JWT
- **Testing**: Jest
- **CI/CD**: GitHub Actions

## API Documentation

### User Schema

```typescript
{
  id: string;           // UUID
  username: string;     // Unique username
  email: string;        // Unique email
  password: string;     // Hashed password
  roles: UserRole[];    // User roles array
  firstName?: string;   // Optional first name
  lastName?: string;    // Optional last name
  isActive: boolean;    // Account status
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### User Roles
```typescript
enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}
```

### gRPC Endpoints

```protobuf
service UsersService {
  rpc ValidateCredentials (ValidateCredentialsRequest) returns (User);
  rpc FindOne (UserById) returns (User);
  rpc FindByUsername (UserByUsername) returns (User);
  rpc Create (CreateUserRequest) returns (User);
  rpc Update (UpdateUserRequest) returns (User);
  rpc Remove (UserById) returns (Empty);
}
```

## Setup and Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start PostgreSQL:
```bash
# Using Docker
docker-compose up -d db

# Or use your local PostgreSQL instance
```

5. Run migrations:
```bash
npm run migration:run
```

6. Start the service:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### Environment Variables

```env
# Server
PORT=5002
GRPC_PORT=5052
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=users

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h

# gRPC
GRPC_PORT=5000
```

### Docker Support

Build the image:
```bash
docker build -t users-microservice .
```

Run the container:
```bash
docker run -p 3000:3000 -p 5000:5000 users-microservice
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Security Features

- Password hashing using bcrypt
- Role-based access control
- Service-to-service authentication
- Input validation
- Rate limiting
- Secure configuration management

## Health Checks

The service includes health check endpoints to monitor:
- Service status
- Database connection
- gRPC server status

## API Documentation

The gRPC service definitions can be found in `src/users.proto`. The service implements the following methods:

### ValidateCredentials
- Validates user login credentials
- Input: ValidateCredentialsRequest (username, password)
- Returns: User
- Throws: UnauthorizedException for invalid credentials

### FindOne
- Returns a single user by ID
- Input: UserById
- Returns: User
- Throws: NotFoundException if user doesn't exist

### FindByUsername
- Returns a single user by username
- Input: UserByUsername
- Returns: User
- Throws: NotFoundException if user doesn't exist

### Create
- Creates a new user
- Input: CreateUserRequest
- Returns: User
- Throws: ConflictException if username/email exists

### Update
- Updates an existing user
- Input: UpdateUserRequest
- Returns: User
- Throws: NotFoundException if user doesn't exist

### Remove
- Deactivates a user account
- Input: UserById
- Returns: Empty
- Throws: NotFoundException if user doesn't exist

## Error Handling

The service implements comprehensive error handling for:
- Authentication errors
- Validation errors
- Database constraints
- Duplicate entries
- Not found resources
- Internal server errors

## Monitoring

The service exposes the following monitoring endpoints:

- Health Check: `/health`
- Metrics: `/metrics`
- OpenAPI Docs: `/docs`

## Related Services
- [API Gateway](https://github.com/mohamed-achich/api-gateway) - API Gateway and Authentication Service
- [Orders Service](https://github.com/mohamed-achich/orders-microservice) - Order Management Service
- [Products Service](https://github.com/mohamed-achich/products-microservice) - Product Catalog Service
- [E-commerce Deployment](https://github.com/mohamed-achich/ecommerce-deployment) - Infrastructure and Deployment

For the complete architecture and deployment instructions, visit the [E-commerce Platform Deployment Repository](https://github.com/mohamed-achich/ecommerce-deployment).
