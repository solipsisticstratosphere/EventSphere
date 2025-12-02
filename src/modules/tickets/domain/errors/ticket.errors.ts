import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../../core/errors/domain.error';

export class TicketNotFoundError extends DomainError {
  readonly code = 'TICKET_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(ticketId: string) {
    super(`Ticket with ID ${ticketId} not found`);
  }
}

export class TicketEventNotFoundError extends DomainError {
  readonly code = 'EVENT_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(eventId: string) {
    super(`Event with ID ${eventId} not found`);
  }
}

export class TicketEventAlreadyPastError extends DomainError {
  readonly code = 'EVENT_ALREADY_PAST';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor() {
    super('This event has already occurred');
  }
}

export class TicketAlreadyExistsError extends DomainError {
  readonly code = 'TICKET_ALREADY_EXISTS';
  readonly statusCode = HttpStatus.CONFLICT;

  constructor() {
    super('You have already purchased a ticket for this event');
  }
}

export class PaymentFailedError extends DomainError {
  readonly code = 'PAYMENT_FAILED';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(message: string) {
    super(`Payment failed: ${message}`);
  }
}

