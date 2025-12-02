import { Injectable, Inject } from "@nestjs/common";
import { EventRepository } from "../../domain/repositories/event.repository.interface";
import { Event } from "../../domain/entities/event.entity";
import {
  EventNotFoundError,
  EventAlreadyCancelledError,
  CannotCancelPastEventError,
} from "../../domain/errors/event.errors";
import { EVENT_REPOSITORY } from "../../events.tokens";
import { EventEmitterService, EventCanceledEvent } from "../../../../shared";
import { TicketRepository } from "../../../tickets/domain/repositories/ticket.repository.interface";
import { TICKET_REPOSITORY } from "../../../tickets/tickets.tokens";

@Injectable()
export class CancelEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
    @Inject(TICKET_REPOSITORY) private readonly ticketRepository: TicketRepository,
    private readonly eventEmitter: EventEmitterService
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

    const canceledEvent = await this.eventRepository.update(eventId, {
      status: "CANCELLED",
    });

    const tickets = await this.ticketRepository.findByEvent(eventId);
    const affectedUserEmails = tickets
      .map(ticket => (ticket as any).user?.email)
      .filter(email => !!email);

    if (affectedUserEmails.length > 0) {
      const eventCanceledEvent: EventCanceledEvent = {
        eventId: canceledEvent.id,
        eventTitle: canceledEvent.title,
        reason: 'Event has been cancelled',
        affectedUserEmails,
      };
      this.eventEmitter.emit('event.canceled', eventCanceledEvent);
    }

    return canceledEvent;
  }
}
