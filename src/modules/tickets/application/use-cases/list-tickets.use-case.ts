import { Injectable, Inject } from '@nestjs/common';
import { TicketRepository } from '../../domain/repositories/ticket.repository.interface';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TICKET_REPOSITORY } from '../../tickets.tokens';

@Injectable()
export class ListTicketsUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository) {}

  async execute(): Promise<Ticket[]> {
    return this.ticketRepository.findAll();
  }
}

