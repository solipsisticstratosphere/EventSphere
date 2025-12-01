import { Injectable, Inject } from "@nestjs/common";
import { EventRepository } from "../../domain/repositories/event.repository.interface";
import { Event } from "../../domain/entities/event.entity";
import {
  EventNotFoundError,
  EventAlreadyCancelledError,
  CannotCancelPastEventError,
} from "../../domain/errors/event.errors";
import { EVENT_REPOSITORY } from "../../events.tokens";

@Injectable()
export class CancelEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository
  ) {}

  async execute(eventId: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    if (event.status === "CANCELLED") {
      throw new EventAlreadyCancelledError();
    }

    if (event.isPast()) {
      throw new CannotCancelPastEventError();
    }

    return this.eventRepository.update(eventId, {
      status: "CANCELLED",
    });
  }
}
