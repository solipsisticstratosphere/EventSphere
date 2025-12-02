import { Injectable, Inject } from '@nestjs/common';
import { TicketRepository } from '../../domain/repositories/ticket.repository.interface';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketNotFoundError } from '../../domain/errors/ticket.errors';
import { TICKET_REPOSITORY } from '../../tickets.tokens';

@Injectable()
export class GetTicketUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository) {}

  async execute(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findById(id);
    
    if (!ticket) {
      throw new TicketNotFoundError(id);
    }

    return ticket;
  }
}

