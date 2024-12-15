# Users Microservice

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

## User Schema

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

## API Endpoints (gRPC)

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
Create a `.env` file with the following variables:
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

# Security
JWT_SECRET=your_jwt_secret
BCRYPT_SALT_ROUNDS=10
SERVICE_AUTH_TOKEN=your_service_auth_token
```

4. Run the service:
```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

## Docker Support

Build and run using Docker:

```bash
# Build the image
docker build -t users-service .

# Run the container
docker run -p 5002:5002 -p 5052:5052 users-service
```

Using Docker Compose:

```bash
docker-compose up
```

## Database Migrations

```bash
# Generate a migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migrations
npm run migration:revert
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

The service exposes metrics for:
- Authentication attempts
- User operations
- Error rates
- Database operations
- Service health
