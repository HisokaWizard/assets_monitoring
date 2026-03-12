import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request } from "express";

/**
 * Interceptor that logs HTTP request method, URL and execution time.
 * Logs successful requests via Logger.log and failed requests via Logger.error.
 * Format: `GET /api/assets - Xms`
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  /**
   * Intercepts incoming HTTP requests and logs method, URL and execution time.
   * On success, logs via `logger.log`. On error, logs via `logger.error`
   * and re-throws the original error.
   *
   * @param context - The execution context providing access to the HTTP request
   * @param next - The call handler that delegates to the route handler
   * @returns Observable that emits the response data unchanged
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${url} - ${Date.now() - now}ms`);
      }),
      catchError((err: Error) => {
        this.logger.error(`${method} ${url} - ${Date.now() - now}ms`);
        return throwError(() => err);
      }),
    );
  }
}
