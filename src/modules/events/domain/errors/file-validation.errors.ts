import { HttpStatus } from "@nestjs/common";
import { DomainError } from "../../../../core/errors/domain.error";

export class NoFilesUploadedError extends DomainError {
  readonly code = "NO_FILES_UPLOADED";
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor() {
    super("No files uploaded");
  }
}

export class FileTooLargeError extends DomainError {
  readonly code = "FILE_TOO_LARGE";
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(filename: string, maxSize: number) {
    super(
      `File ${filename} is too large. Max size is ${maxSize / 1024 / 1024}MB`
    );
  }
}

export class InvalidFileTypeError extends DomainError {
  readonly code = "INVALID_FILE_TYPE";
  readonly statusCode = HttpStatus.BAD_REQUEST;

  constructor(filename: string, allowedTypes: string[]) {
    super(
      `File ${filename} has invalid type. Allowed types: ${allowedTypes.join(
        ", "
      )}`
    );
  }
}
