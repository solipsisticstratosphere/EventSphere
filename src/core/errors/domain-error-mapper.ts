import { HttpStatus } from "@nestjs/common";
import { DomainError } from "./domain.error";

export interface DomainErrorMapping {
  [errorName: string]: HttpStatus;
}

const defaultDomainErrorMapping: DomainErrorMapping = {
  EventNotFoundError: HttpStatus.NOT_FOUND,
  TicketNotFoundError: HttpStatus.NOT_FOUND,
  UserNotFoundError: HttpStatus.NOT_FOUND,
  UserEmailNotFoundError: HttpStatus.NOT_FOUND,
  ImageNotFoundError: HttpStatus.NOT_FOUND,

  EventAlreadyPastError: HttpStatus.BAD_REQUEST,
  EventAlreadyCancelledError: HttpStatus.BAD_REQUEST,
  CannotCancelPastEventError: HttpStatus.BAD_REQUEST,
  TicketAlreadyExistsError: HttpStatus.CONFLICT,
  PaymentFailedError: HttpStatus.BAD_REQUEST,
  NoFilesUploadedError: HttpStatus.BAD_REQUEST,
  FileTooLargeError: HttpStatus.BAD_REQUEST,
  InvalidFileTypeError: HttpStatus.BAD_REQUEST,

  UserNotAllowedError: HttpStatus.FORBIDDEN,
};

export function getHttpStatusFromDomainError(error: DomainError): HttpStatus {
  return (
    defaultDomainErrorMapping[error.constructor.name] ||
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}

