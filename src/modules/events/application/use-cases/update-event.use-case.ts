import { Injectable, Inject } from '@nestjs/common';
import { EventRepository, EventUpdateData } from '../../domain/repositories/event.repository.interface';
import { Event } from '../../domain/entities/event.entity';
import { EventNotFoundError } from '../../domain/errors/event.errors';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EVENT_REPOSITORY } from '../../events.tokens';

@Injectable()
export class UpdateEventUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository) {}

  async execute(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const existingEvent = await this.eventRepository.findById(id);
    
    if (!existingEvent) {
      throw new EventNotFoundError(id);
    }

    const updateData: EventUpdateData = {};
    if (updateEventDto.title !== undefined) updateData.title = updateEventDto.title;
    if (updateEventDto.description !== undefined) updateData.description = updateEventDto.description;
    if (updateEventDto.date !== undefined) updateData.date = new Date(updateEventDto.date);
    if (updateEventDto.location !== undefined) updateData.location = updateEventDto.location;
    if (updateEventDto.price !== undefined) updateData.price = updateEventDto.price;
    if (updateEventDto.image !== undefined) updateData.image = updateEventDto.image;
    if (updateEventDto.images !== undefined) updateData.images = updateEventDto.images;
    if (updateEventDto.thumbnailUrl !== undefined) updateData.thumbnailUrl = updateEventDto.thumbnailUrl;
    if (updateEventDto.category !== undefined) updateData.category = updateEventDto.category;
    if (updateEventDto.status !== undefined) updateData.status = updateEventDto.status;

    return this.eventRepository.update(id, updateData);
  }
}

