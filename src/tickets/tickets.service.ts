import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PaymentService } from './services/payment.service';
import { NotificationQueue } from '../queues/notification.queue';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private notificationQueue: NotificationQueue,
  ) {}

  async purchaseTicket(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (new Date(event.date) < new Date()) {
      throw new BadRequestException('This event has already occurred');
    }

    const existingTicket = await this.prisma.ticket.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    if (existingTicket) {
      throw new ConflictException(
        'You have already purchased a ticket for this event',
      );
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        userId,
        eventId,
        status: 'PENDING',
      },
      include: {
        event: true,
        user: true,
      },
    });

    try {
      const paymentResult = await this.paymentService.simulatePayment();

      if (paymentResult.success) {
        const paidTicket = await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: 'PAID' },
          include: {
            event: true,
            user: true,
          },
        });

        await this.notificationQueue.addTicketPurchasedNotification({
          userId: paidTicket.user.id,
          userEmail: paidTicket.user.email,
          userName: paidTicket.user.name,
          eventId: paidTicket.event.id,
          eventTitle: paidTicket.event.title,
          eventDate: paidTicket.event.date,
          ticketId: paidTicket.id,
        });

        return {
          success: true,
          message: paymentResult.message,
          ticket: paidTicket,
        };
      } else {
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: 'FAILED' },
        });

        throw new BadRequestException(
          `Payment failed: ${paymentResult.message}`,
        );
      }
    } catch (error) {
      if (ticket.status === 'PENDING') {
        await this.prisma.ticket.delete({
          where: { id: ticket.id },
        });
      }
      throw error;
    }
  }

  async create(userId: string, createTicketDto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        eventId: createTicketDto.eventId,
        userId,
      },
    });
  }

  async findAll() {
    return this.prisma.ticket.findMany({
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    const data: any = {};
    if (updateTicketDto.eventId) {
      data.eventId = updateTicketDto.eventId;
    }

    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.ticket.delete({
      where: { id },
    });
  }
}
