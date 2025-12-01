import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from './services/payment.service';
import { NotificationQueue } from '../queues/notification.queue';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

jest.mock('../queues/notification.queue');
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn(),
}));

describe('TicketsService', () => {
  let service: TicketsService;
  let prismaService: PrismaService;
  let paymentService: PaymentService;
  let notificationQueue: NotificationQueue;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPaymentService = {
    simulatePayment: jest.fn(),
  };

  const mockNotificationQueue = {
    addTicketPurchasedNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
        {
          provide: NotificationQueue,
          useValue: mockNotificationQueue,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prismaService = module.get<PrismaService>(PrismaService);
    paymentService = module.get<PaymentService>(PaymentService);
    notificationQueue = module.get<NotificationQueue>(NotificationQueue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('purchaseTicket', () => {
    const userId = 'user-123';
    const eventId = 'event-123';
    const futureDate = new Date(Date.now() + 86400000);

    const mockEvent = {
      id: eventId,
      title: 'Test Event',
      description: 'Test Description',
      date: futureDate,
      location: 'Test Location',
      price: 100,
    };

    const mockUser = {
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
    };

    it('should successfully purchase a ticket', async () => {
      const mockTicket = {
        id: 'ticket-123',
        userId,
        eventId,
        status: 'PENDING',
        event: mockEvent,
        user: mockUser,
      };

      const mockPaidTicket = {
        ...mockTicket,
        status: 'PAID',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);
      mockPaymentService.simulatePayment.mockResolvedValue({
        success: true,
        message: 'Payment successful',
      });
      mockPrismaService.ticket.update.mockResolvedValue(mockPaidTicket);
      mockNotificationQueue.addTicketPurchasedNotification.mockResolvedValue(undefined);

      const result = await service.purchaseTicket(userId, eventId);

      expect(result).toEqual({
        success: true,
        message: 'Payment successful',
        ticket: mockPaidTicket,
      });
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith({
        where: { userId, eventId },
      });
      expect(mockPrismaService.ticket.create).toHaveBeenCalled();
      expect(mockPaymentService.simulatePayment).toHaveBeenCalled();
      expect(mockNotificationQueue.addTicketPurchasedNotification).toHaveBeenCalled();
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.purchaseTicket(userId, eventId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
    });

    it('should throw BadRequestException if event date has passed', async () => {
      const pastEvent = {
        ...mockEvent,
        date: new Date(Date.now() - 86400000),
      };

      mockPrismaService.event.findUnique.mockResolvedValue(pastEvent);

      await expect(service.purchaseTicket(userId, eventId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
      });
    });

    it('should throw ConflictException if duplicate ticket exists', async () => {
      const existingTicket = {
        id: 'existing-ticket',
        userId,
        eventId,
        status: 'PAID',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(existingTicket);

      await expect(service.purchaseTicket(userId, eventId)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.ticket.findFirst).toHaveBeenCalledWith({
        where: { userId, eventId },
      });
    });

    it('should handle payment failure and update ticket status', async () => {
      const mockTicket = {
        id: 'ticket-123',
        userId,
        eventId,
        status: 'PENDING',
        event: mockEvent,
        user: mockUser,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);
      mockPaymentService.simulatePayment.mockResolvedValue({
        success: false,
        message: 'Insufficient funds',
      });
      mockPrismaService.ticket.update.mockResolvedValue({
        ...mockTicket,
        status: 'FAILED',
      });

      await expect(service.purchaseTicket(userId, eventId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.ticket.update).toHaveBeenCalledWith({
        where: { id: mockTicket.id },
        data: { status: 'FAILED' },
      });
    });

    it('should delete ticket if payment throws an error', async () => {
      const mockTicket = {
        id: 'ticket-123',
        userId,
        eventId,
        status: 'PENDING',
        event: mockEvent,
        user: mockUser,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(null);
      mockPrismaService.ticket.create.mockResolvedValue(mockTicket);
      mockPaymentService.simulatePayment.mockRejectedValue(
        new Error('Payment service error'),
      );
      mockPrismaService.ticket.delete.mockResolvedValue(mockTicket);

      await expect(service.purchaseTicket(userId, eventId)).rejects.toThrow(
        'Payment service error',
      );
      expect(mockPrismaService.ticket.delete).toHaveBeenCalledWith({
        where: { id: mockTicket.id },
      });
    });
  });

  describe('checkDuplicate', () => {
    it('should prevent duplicate ticket purchase (tested via purchaseTicket)', async () => {
      const userId = 'user-123';
      const eventId = 'event-123';
      const futureDate = new Date(Date.now() + 86400000);

      const mockEvent = {
        id: eventId,
        title: 'Test Event',
        date: futureDate,
      };

      const existingTicket = {
        id: 'existing-ticket',
        userId,
        eventId,
        status: 'PAID',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.ticket.findFirst.mockResolvedValue(existingTicket);

      await expect(service.purchaseTicket(userId, eventId)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.purchaseTicket(userId, eventId)).rejects.toThrow(
        'You have already purchased a ticket for this event',
      );
    });
  });

  describe('findByUser', () => {
    it('should return all tickets for a user', async () => {
      const userId = 'user-123';
      const mockTickets = [
        {
          id: 'ticket-1',
          userId,
          eventId: 'event-1',
          status: 'PAID',
          event: {
            id: 'event-1',
            title: 'Event 1',
          },
        },
        {
          id: 'ticket-2',
          userId,
          eventId: 'event-2',
          status: 'PAID',
          event: {
            id: 'event-2',
            title: 'Event 2',
          },
        },
      ];

      mockPrismaService.ticket.findMany.mockResolvedValue(mockTickets);

      const result = await service.findByUser(userId);

      expect(result).toEqual(mockTickets);
      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { event: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a ticket by id', async () => {
      const ticketId = 'ticket-123';
      const mockTicket = {
        id: ticketId,
        userId: 'user-123',
        eventId: 'event-123',
        status: 'PAID',
        event: {
          id: 'event-123',
          title: 'Test Event',
        },
        user: {
          id: 'user-123',
          name: 'Test User',
        },
      };

      mockPrismaService.ticket.findUnique.mockResolvedValue(mockTicket);

      const result = await service.findOne(ticketId);

      expect(result).toEqual(mockTicket);
      expect(mockPrismaService.ticket.findUnique).toHaveBeenCalledWith({
        where: { id: ticketId },
        include: {
          event: true,
          user: true,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a ticket', async () => {
      const ticketId = 'ticket-123';
      const mockTicket = {
        id: ticketId,
        userId: 'user-123',
        eventId: 'event-123',
      };

      mockPrismaService.ticket.delete.mockResolvedValue(mockTicket);

      const result = await service.remove(ticketId);

      expect(result).toEqual(mockTicket);
      expect(mockPrismaService.ticket.delete).toHaveBeenCalledWith({
        where: { id: ticketId },
      });
    });
  });
});
