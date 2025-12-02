import { TicketStatus } from '@prisma/client';

export class Ticket {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly userId: string,
    public readonly status: TicketStatus = TicketStatus.PENDING,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static fromPrisma(data: any): Ticket {
    return new Ticket(
      data.id,
      data.eventId,
      data.userId,
      data.status,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }

  isPaid(): boolean {
    return this.status === TicketStatus.PAID;
  }

  isPending(): boolean {
    return this.status === TicketStatus.PENDING;
  }

  isFailed(): boolean {
    return this.status === TicketStatus.FAILED;
  }

  markAsPaid(): Ticket {
    return new Ticket(
      this.id,
      this.eventId,
      this.userId,
      TicketStatus.PAID,
      this.createdAt,
      this.updatedAt,
    );
  }

  markAsFailed(): Ticket {
    return new Ticket(
      this.id,
      this.eventId,
      this.userId,
      TicketStatus.FAILED,
      this.createdAt,
      this.updatedAt,
    );
  }
}




