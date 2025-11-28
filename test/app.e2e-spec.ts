import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('EventSphere E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let eventId: string;
  let ticketId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    await prisma.ticket.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-e2e',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test-e2e',
        },
      },
    });

    await app.close();
  });

  describe('Auth Flow (POST /auth/register → POST /auth/login)', () => {
    const testUser = {
      email: 'test-e2e-user@example.com',
      password: 'Password123!',
      name: 'E2E Test User',
    };

    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('access_token');
          expect(response.body).toHaveProperty('refresh_token');
          expect(response.body.user).toHaveProperty('email', testUser.email);
          expect(response.body.user).toHaveProperty('name', testUser.name);
          expect(response.body.user).not.toHaveProperty('password');
          userId = response.body.user.id;
        });
    });

    it('should not register user with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('access_token');
          expect(response.body).toHaveProperty('refresh_token');
          expect(response.body.user).toHaveProperty('email', testUser.email);
          accessToken = response.body.access_token;
        });
    });

    it('should fail login with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password',
        })
        .expect(401);
    });
  });

  describe('Events Flow (POST /events → GET /events/:id)', () => {
    const testEvent = {
      title: 'E2E Test Event',
      description: 'This is a test event for E2E testing',
      date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      location: 'Test Location',
      price: 50,
      category: 'TEST',
      maxAttendees: 100,
    };

    it('should create a new event', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(testEvent)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('title', testEvent.title);
          expect(response.body).toHaveProperty('description', testEvent.description);
          expect(response.body).toHaveProperty('price', testEvent.price);
          eventId = response.body.id;
        });
    });

    it('should get event by id', () => {
      return request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', eventId);
          expect(response.body).toHaveProperty('title', testEvent.title);
          expect(response.body).toHaveProperty('description', testEvent.description);
        });
    });

    it('should get all events with pagination', () => {
      return request(app.getHttpServer())
        .get('/events')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
          expect(response.body.meta).toHaveProperty('total');
          expect(response.body.meta).toHaveProperty('page', 1);
          expect(response.body.meta).toHaveProperty('limit', 10);
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should update event', () => {
      const updatedData = {
        title: 'Updated E2E Test Event',
        price: 75,
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedData)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('title', updatedData.title);
          expect(response.body).toHaveProperty('price', updatedData.price);
        });
    });

    it('should return 404 for non-existent event', () => {
      return request(app.getHttpServer())
        .get('/events/non-existent-id')
        .expect(404);
    });

    it('should fail to create event without authentication', () => {
      return request(app.getHttpServer())
        .post('/events')
        .send(testEvent)
        .expect(401);
    });
  });

  describe('Tickets Flow (POST /tickets/purchase → GET /analytics/statistics)', () => {
    it('should purchase a ticket', () => {
      return request(app.getHttpServer())
        .post(`/tickets/purchase/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('ticket');
          expect(response.body.ticket).toHaveProperty('id');
          expect(response.body.ticket).toHaveProperty('status', 'PAID');
          expect(response.body.ticket).toHaveProperty('eventId', eventId);
          ticketId = response.body.ticket.id;
        });
    });

    it('should not allow duplicate ticket purchase', () => {
      return request(app.getHttpServer())
        .post(`/tickets/purchase/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(409)
        .then((response) => {
          expect(response.body.message).toContain('already purchased');
        });
    });

    it('should get user tickets', () => {
      return request(app.getHttpServer())
        .get('/tickets/my-tickets')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThan(0);
          expect(response.body[0]).toHaveProperty('id', ticketId);
          expect(response.body[0]).toHaveProperty('event');
        });
    });

    it('should verify statistics are updated after ticket purchase', () => {
      return request(app.getHttpServer())
        .get('/analytics/statistics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('totalTicketsSold');
          expect(response.body.totalTicketsSold).toBeGreaterThan(0);
          expect(response.body).toHaveProperty('totalRevenue');
          expect(response.body.totalRevenue).toBeGreaterThan(0);
        });
    });

    it('should fail to purchase ticket for non-existent event', () => {
      return request(app.getHttpServer())
        .post('/tickets/purchase/non-existent-event-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail to purchase ticket without authentication', () => {
      return request(app.getHttpServer())
        .post(`/tickets/purchase/${eventId}`)
        .expect(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle pagination with invalid parameters', () => {
      return request(app.getHttpServer())
        .get('/events')
        .query({ page: -1, limit: 0 })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('meta');
        });
    });

    it('should validate event creation with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Incomplete Event',
        })
        .expect(400);
    });

    it('should not create event with past date', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Past Event',
          description: 'Event in the past',
          date: new Date(Date.now() - 86400000).toISOString(),
          location: 'Test Location',
          price: 50,
        })
        .expect(400);
    });
  });
});
