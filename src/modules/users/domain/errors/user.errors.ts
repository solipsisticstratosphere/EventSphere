import { HttpStatus } from '@nestjs/common';
import { DomainError } from '../../../../core/errors/domain.error';

export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}

export class UserEmailNotFoundError extends DomainError {
  readonly code = 'USER_EMAIL_NOT_FOUND';
  readonly statusCode = HttpStatus.NOT_FOUND;

  constructor(email: string) {
    super(`User with email ${email} not found`);
  }
}

