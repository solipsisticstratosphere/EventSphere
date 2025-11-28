# EventSphere

EventSphere is a comprehensive event management system built with NestJS, providing real-time ticket purchasing, event management, and notification services.

## Table of Contents

- [Description](#description)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Features](#features)
- [Installation](#installation)
  - [Local Development](#local-development)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Description

EventSphere is a modern event management platform that allows users to:

- Browse and search events with advanced filtering
- Purchase tickets with payment simulation
- Receive real-time notifications via WebSockets
- Track event statistics and analytics
- Manage event images with S3 integration
- Handle concurrent ticket purchases with Redis-based locking

## Technologies

### Core Framework
- **NestJS** - Progressive Node.js framework for building scalable applications
- **TypeScript** - Typed superset of JavaScript

### Database & ORM
- **PostgreSQL** - Primary relational database
- **Prisma** - Next-generation ORM for type-safe database access

### Caching & Queue Management
- **Redis** - In-memory data store for caching and session management
- **BullMQ** - Redis-based queue for background job processing

### Real-time Communication
- **WebSockets (Socket.IO)** - Real-time bidirectional event-based communication

### Storage
- **AWS S3 / LocalStack** - Object storage for event images

### API Documentation
- **Swagger** - OpenAPI documentation and testing interface

### Testing
- **Jest** - JavaScript testing framework
- **Supertest** - HTTP assertion library for E2E testing

### DevOps
- **Docker** - Containerization platform (Node.js 20 Alpine)
- **Docker Compose** - Multi-container orchestration

## Architecture

EventSphere follows a modular architecture with the following main modules:

```
EventSphere/
├── Auth Module         - JWT-based authentication with refresh tokens
├── Users Module        - User management and profiles
├── Events Module       - Event CRUD operations with image upload
├── Tickets Module      - Ticket purchasing with payment simulation
├── Notifications       - Background job processing for notifications
├── WebSockets         - Real-time event updates and online users
├── Analytics Module    - Event and ticket statistics
└── Common             - Shared decorators, guards, and utilities
```

### Data Flow

1. **Event Creation**: Organizer creates event → Images uploaded to S3 → Event saved to PostgreSQL
2. **Ticket Purchase**: User requests ticket → Check duplicate → Create pending ticket → Process payment → Update status → Queue notification → Emit WebSocket event
3. **Real-time Updates**: WebSocket gateway tracks online users and event viewers → Broadcasts ticket purchases
4. **Caching**: Frequently accessed data cached in Redis with configurable TTL

## Features

### Authentication & Authorization
- JWT-based authentication
- Refresh token rotation
- Role-based access control (USER, ORGANIZER, ADMIN)
- Protected routes with Guards

### Event Management
- Create, read, update, delete events
- Image upload with S3 integration
- Advanced filtering (search, category, price range, date)
- Pagination support
- Event statistics

### Ticket System
- Ticket purchasing with payment simulation
- Duplicate purchase prevention
- Transaction rollback on payment failure
- User ticket history

### Real-time Features
- Online users tracking
- Event viewers count
- Live ticket purchase notifications
- WebSocket-based updates

### Background Jobs
- Email notification simulation using BullMQ
- Async ticket processing
- Job monitoring with Bull Board (optional)

### Performance Optimization
- Redis caching with custom TTL decorator
- Rate limiting with throttling
- Database query optimization
- Connection pooling

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/solipsisticstratosphere/EventSphere.git
cd EventSphere
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

4. **Start required services (PostgreSQL, Redis, LocalStack)**
```bash
docker-compose up postgres redis localstack -d
```

5. **Run database migrations**
```bash
npm run prisma:migrate
```

6. **Generate Prisma Client**
```bash
npm run prisma:generate
```

7. **Start the development server**
```bash
npm run start:dev
```

The application will be available at `http://localhost:3000/api`

### Docker Setup

**Build and run all services**
```bash
docker-compose up --build
```

This will start:
- **API** - NestJS application (port 3000)
- **PostgreSQL** - Database (port 5432)
- **Redis** - Cache & Queue (port 6379)
- **LocalStack** - S3 emulation (port 4566)
- **Bull Board** - Queue monitoring (port 3001)

**Run specific services**
```bash
docker-compose up postgres redis localstack

docker-compose up api
```

**Stop all services**
```bash
docker-compose down
```

**Stop and remove volumes**
```bash
docker-compose down -v
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://eventsphere:eventsphere123@localhost:5432/eventsphere?schema=public"
POSTGRES_USER=eventsphere
POSTGRES_PASSWORD=eventsphere123
POSTGRES_DB=eventsphere

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 (LocalStack for development)
AWS_S3_BUCKET=eventsphere-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_ENDPOINT=http://localhost:4566
AWS_S3_FORCE_PATH_STYLE=true

# CORS
CORS_ORIGIN=http://localhost:3001
```

See [.env.example](.env.example) for complete configuration.

## Running the Application

### Development
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## API Documentation

### Swagger UI
Once the application is running, access the interactive API documentation at:

**http://localhost:3000/api/docs**

### Main Endpoints

#### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user

#### Events
- `GET /events` - Get all events (with pagination and filters)
- `GET /events/:id` - Get event by ID
- `POST /events` - Create new event (protected)
- `PATCH /events/:id` - Update event (protected)
- `DELETE /events/:id` - Delete event (protected)
- `POST /events/:id/images` - Upload event images (protected)
- `DELETE /events/:id/images` - Delete event image (protected)

#### Tickets
- `POST /tickets/purchase/:eventId` - Purchase ticket (protected)
- `GET /tickets/my-tickets` - Get user's tickets (protected)
- `GET /tickets/:id` - Get ticket by ID (protected)

#### Analytics
- `GET /analytics/statistics` - Get overall statistics (protected)
- `GET /analytics/events/:id/statistics` - Get event statistics (protected)

#### Users
- `GET /users/profile` - Get current user profile (protected)
- `PATCH /users/profile` - Update user profile (protected)

### Example Requests

**Register a new user**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Create an event**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Music Festival",
    "description": "Amazing music festival",
    "date": "2025-12-31T18:00:00Z",
    "location": "Central Park",
    "price": 50,
    "category": "Music"
  }'
```

**Purchase a ticket**
```bash
curl -X POST http://localhost:3000/api/tickets/purchase/EVENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Testing

### Unit Tests
Run all unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:cov
```

### E2E Tests
Run end-to-end tests:
```bash
npm run test:e2e
```

### Test Coverage

The project includes comprehensive test coverage for:

**Unit Tests:**
- `AuthService` - Login, registration, token validation
- `EventsService` - CRUD operations, image management
- `TicketsService` - Ticket purchasing, duplicate prevention
- `S3Service` - File upload/download operations

**E2E Tests:**
- Auth flow (register → login)
- Event management (create → get → update)
- Ticket purchasing with statistics updates
- Error handling and validation

Current test results: **41 passing tests**

## Project Structure

```
EventSphere/
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── dto/              # Data transfer objects
│   │   ├── guards/           # JWT guards
│   │   ├── strategies/       # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts
│   ├── users/                # Users module
│   ├── events/               # Events module
│   │   ├── dto/
│   │   ├── events.controller.ts
│   │   ├── events.service.ts
│   │   └── events.service.spec.ts
│   ├── tickets/              # Tickets module
│   │   ├── dto/
│   │   ├── services/
│   │   │   └── payment.service.ts
│   │   ├── tickets.controller.ts
│   │   ├── tickets.service.ts
│   │   └── tickets.service.spec.ts
│   ├── notifications/        # Notifications module
│   ├── queues/               # BullMQ queue processors
│   │   ├── notification.queue.ts
│   │   └── notification.processor.ts
│   ├── websockets/           # WebSocket gateway
│   │   ├── events.gateway.ts
│   │   └── services/
│   ├── analytics/            # Analytics module
│   ├── s3/                   # S3 storage service
│   │   ├── s3.service.ts
│   │   └── s3.service.spec.ts
│   ├── prisma/               # Prisma service
│   ├── common/               # Shared resources
│   │   ├── decorators/       # Custom decorators
│   │   ├── guards/           # Guards
│   │   └── interceptors/     # Interceptors
│   ├── app.module.ts
│   └── main.ts
├── test/                     # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── prisma/
│   └── schema.prisma        # Database schema
├── docker-compose.yml       # Docker services configuration
├── Dockerfile              # Production Docker image
├── .dockerignore
├── .env.example            # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

The application uses PostgreSQL with Prisma ORM. Main entities:

- **User** - User accounts with authentication
- **Event** - Event information and details
- **Ticket** - Ticket purchases linked to users and events
- **Notification** - Notification queue entries

Run Prisma Studio to explore the database:
```bash
npm run prisma:studio
```

## WebSocket Events

Connect to `ws://localhost:3000` to receive real-time updates:

### Client → Server
- `join` - Join event room
- `leave` - Leave event room

### Server → Client
- `online_users` - Current online users count
- `event_viewers` - Users viewing specific event
- `ticket:purchased` - Ticket purchase notification

## Author

**Yaroslav Klimenko**

- GitHub: [@solipsisticstratosphere](https://github.com/solipsisticstratosphere)
- Repository: [EventSphere](https://github.com/solipsisticstratosphere/EventSphere)


