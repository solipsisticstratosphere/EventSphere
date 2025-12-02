import { Injectable, Inject } from '@nestjs/common';
import { TicketRepository, TicketCreateData } from '../../domain/repositories/ticket.repository.interface';
import { Ticket } from '../../domain/entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { TICKET_REPOSITORY } from '../../tickets.tokens';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class CreateTicketUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository) {}

  async execute(userId: string, createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticketData: TicketCreateData = {
      eventId: createTicketDto.eventId,
      userId,
      status: TicketStatus.PENDING,
    };
    return this.ticketRepository.create(ticketData);
  }
}

