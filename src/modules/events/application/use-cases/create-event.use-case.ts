import { Injectable, Inject } from "@nestjs/common";
import { EventRepository } from "../../domain/repositories/event.repository.interface";
import { Event } from "../../domain/entities/event.entity";
import { CreateEventDto } from "../dto/create-event.dto";
import { EVENT_REPOSITORY } from "../../events.tokens";

@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository
  ) {}

  async execute(
    userId: string,
    createEventDto: CreateEventDto
  ): Promise<Event> {
    const event = new Event(
      "",
      createEventDto.title,
      createEventDto.description,
      new Date(createEventDto.date),
      createEventDto.location,
      createEventDto.price,
      userId,
      createEventDto.image,
      createEventDto.images || [],
      createEventDto.thumbnailUrl,
      createEventDto.category,
      createEventDto.status || "ACTIVE"
    );

    return this.eventRepository.create(event);
  }
}
