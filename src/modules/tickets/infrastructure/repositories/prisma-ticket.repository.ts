import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TicketRepository, EventRepository, TicketCreateData, TicketUpdateData } from '../../domain/repositories/ticket.repository.interface';
import { Ticket } from '../../domain/entities/ticket.entity';

@Injectable()
export class PrismaTicketRepository implements TicketRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ticketData: TicketCreateData): Promise<Ticket> {
    const created = await this.prisma.ticket.create({
      data: {
        eventId: ticketData.eventId,
        userId: ticketData.userId,
        status: ticketData.status,
      },
    });

    return Ticket.fromPrisma(created);
  }

  async findById(id: string): Promise<Ticket | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    return ticket ? Ticket.fromPrisma(ticket) : null;
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<Ticket | null> {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    return ticket ? Ticket.fromPrisma(ticket) : null;
  }

  async findByUser(userId: string): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { userId },
    });

    return tickets.map(ticket => Ticket.fromPrisma(ticket));
  }

  async findByEvent(eventId: string): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return tickets.map(ticket => {
      const ticketEntity = Ticket.fromPrisma(ticket);
      (ticketEntity as any).user = ticket.user;
      return ticketEntity;
    });
  }

  async findAll(): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany();
    return tickets.map(ticket => Ticket.fromPrisma(ticket));
  }

  async update(id: string, data: TicketUpdateData): Promise<Ticket> {
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...(data.eventId !== undefined && { eventId: data.eventId }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return Ticket.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ticket.delete({
      where: { id },
    });
  }
}

@Injectable()
export class PrismaEventRepositoryAdapter implements EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<any | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
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
}

