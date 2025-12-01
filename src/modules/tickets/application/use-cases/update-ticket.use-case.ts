import { Injectable, Inject } from '@nestjs/common';
import { TicketRepository, TicketUpdateData } from '../../domain/repositories/ticket.repository.interface';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketNotFoundError } from '../../domain/errors/ticket.errors';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TICKET_REPOSITORY } from '../../tickets.tokens';

@Injectable()
export class UpdateTicketUseCase {
  constructor(@Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository) {}

  async execute(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const existingTicket = await this.ticketRepository.findById(id);
    
    if (!existingTicket) {
      throw new TicketNotFoundError(id);
    }

    const updateData: TicketUpdateData = {};
    if (updateTicketDto.eventId !== undefined) {
      updateData.eventId = updateTicketDto.eventId;
    }

    return this.ticketRepository.update(id, updateData);
  }
}

