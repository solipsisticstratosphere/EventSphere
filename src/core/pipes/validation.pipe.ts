import { ValidationPipe as NestValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export const getValidationPipeOptions = (): ValidationPipeOptions => ({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});

export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super(getValidationPipeOptions());
  }
}


