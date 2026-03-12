import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

/**
 * Global exception filter that catches ALL unhandled exceptions
 * and returns a standardized error response to the client.
 *
 * - HttpException → uses exception's status code and response message
 * - Any other exception → returns 500 with generic "Internal server error"
 * - Never exposes stack traces or internal details to the client
 * - Logs errors with stack traces for debugging
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Catches and handles all exceptions thrown during request processing.
   * @param exception - The thrown exception (can be any type)
   * @param host - The arguments host providing access to request/response
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : "",
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
