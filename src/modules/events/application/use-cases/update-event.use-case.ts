import { Injectable, Inject } from '@nestjs/common';
import { EventRepository, EventUpdateData } from '../../domain/repositories/event.repository.interface';
import { Event } from '../../domain/entities/event.entity';
import { EventNotFoundError } from '../../domain/errors/event.errors';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EVENT_REPOSITORY } from '../../events.tokens';
import { EventEmitterService, EventUpdatedEvent } from '../../../../shared';
import { TicketRepository } from '../../../tickets/domain/repositories/ticket.repository.interface';
import { TICKET_REPOSITORY } from '../../../tickets/tickets.tokens';

@Injectable()
export class UpdateEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository,
    private readonly eventEmitter: EventEmitterService
  ) {}

  async execute(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const existingEvent = await this.eventRepository.findById(id);
    
    if (!existingEvent) {
      throw new EventNotFoundError(id);
    }

    const updateData: EventUpdateData = {};
    const changes: string[] = [];

    if (updateEventDto.title !== undefined) {
      updateData.title = updateEventDto.title;
      changes.push('title');
    }
    if (updateEventDto.description !== undefined) {
      updateData.description = updateEventDto.description;
      changes.push('description');
    }
    if (updateEventDto.date !== undefined) {
      updateData.date = new Date(updateEventDto.date);
      changes.push('date');
    }
    if (updateEventDto.location !== undefined) {
      updateData.location = updateEventDto.location;
      changes.push('location');
    }
    if (updateEventDto.price !== undefined) {
      updateData.price = updateEventDto.price;
      changes.push('price');
    }
    if (updateEventDto.image !== undefined) updateData.image = updateEventDto.image;
    if (updateEventDto.images !== undefined) updateData.images = updateEventDto.images;
    if (updateEventDto.thumbnailUrl !== undefined) updateData.thumbnailUrl = updateEventDto.thumbnailUrl;
    if (updateEventDto.category !== undefined) {
      updateData.category = updateEventDto.category;
      changes.push('category');
    }
    if (updateEventDto.status !== undefined) updateData.status = updateEventDto.status;

    const updatedEvent = await this.eventRepository.update(id, updateData);

    if (changes.length > 0) {
      const tickets = await this.ticketRepository.findByEvent(id);
      const affectedUserEmails = tickets
        .map(ticket => (ticket as any).user?.email)
        .filter(email => !!email);

      if (affectedUserEmails.length > 0) {
        const eventUpdatedEvent: EventUpdatedEvent = {
          eventId: updatedEvent.id,
          eventTitle: updatedEvent.title,
          changes,
          affectedUserEmails,
        };
        this.eventEmitter.emit('event.updated', eventUpdatedEvent);
      }
    }

    return updatedEvent;
  }
}

