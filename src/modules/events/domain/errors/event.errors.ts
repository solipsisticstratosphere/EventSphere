import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../../core/errors/domain.error';

export class EventNotFoundError extends DomainError {
  readonly code = 'EVENT_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(eventId: string) {
    super(`Event with ID ${eventId} not found`);
  }
}

export class EventAlreadyPastError extends DomainError {
  readonly code = 'EVENT_ALREADY_PAST';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor() {
    super('This event has already occurred');
  }
}

export class ImageNotFoundError extends DomainError {
  readonly code = 'IMAGE_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor() {
    super('Image not found in event');
  }
}

export class EventAlreadyCancelledError extends DomainError {
  readonly code = 'EVENT_ALREADY_CANCELLED';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Event is already cancelled');
  }
}

export class CannotCancelPastEventError extends DomainError {
  readonly code = 'CANNOT_CANCEL_PAST_EVENT';
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor() {
    super('Cannot cancel past events');
  }
}

