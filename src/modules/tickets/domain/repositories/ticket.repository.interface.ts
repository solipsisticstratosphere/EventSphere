import { Ticket } from '../entities/ticket.entity';
import { TicketStatus } from '@prisma/client';

export type TicketCreateData = Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'isPaid' | 'isPending' | 'isFailed' | 'markAsPaid' | 'markAsFailed'>;
export type TicketUpdateData = Partial<{
  eventId: string;
  status: TicketStatus;
}>;

export interface TicketRepository {
  create(ticket: TicketCreateData): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  findByUserAndEvent(userId: string, eventId: string): Promise<Ticket | null>;
  findByUser(userId: string): Promise<Ticket[]>;
  findByEvent(eventId: string): Promise<Ticket[]>;
  findAll(): Promise<Ticket[]>;
  update(id: string, data: TicketUpdateData): Promise<Ticket>;
  delete(id: string): Promise<void>;
}

export interface EventRepository {
  findById(id: string): Promise<any | null>;
}

