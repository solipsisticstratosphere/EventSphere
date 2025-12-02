import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { DomainError } from "../errors/domain.error";
import { getHttpStatusFromDomainError } from "../errors/domain-error-mapper";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;
    let errorCode: string | undefined;

    if (exception instanceof DomainError) {
      status = getHttpStatusFromDomainError(exception);
      message = exception.message;
      errorCode = exception.code;
    }
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || "Internal server error";
    }
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = "Internal server error";
    }

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === "string"
          ? message
          : (message as any)?.message || "An error occurred",
      ...(errorCode && { code: errorCode }),
      ...(typeof message === "object" && { details: message }),
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : undefined
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${errorResponse.message}`
      );
    }

    response.status(status).json(errorResponse);
  }
}
