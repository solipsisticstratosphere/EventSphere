import { Injectable, Inject } from '@nestjs/common';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { Event } from '../../domain/entities/event.entity';
import { EventNotFoundError } from '../../domain/errors/event.errors';
import { EVENT_REPOSITORY } from '../../events.tokens';

@Injectable()
export class GetEventUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository) {}

  async execute(id: string): Promise<Event> {
    const event = await this.eventRepository.findById(id);
    
    if (!event) {
      throw new EventNotFoundError(id);
    }

    return event;
  }
}

