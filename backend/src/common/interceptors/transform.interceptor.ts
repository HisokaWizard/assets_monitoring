import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Response } from "express";

/**
 * Standard API response wrapper interface.
 * All successful responses are wrapped in this format.
 */
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

/**
 * Interceptor that wraps all successful responses into a standard ApiResponse format.
 * Adds statusCode from the HTTP response and an ISO timestamp.
 *
 * @example
 * ```typescript
 * // Apply globally in main.ts
 * app.useGlobalInterceptors(new TransformInterceptor());
 *
 * // Or apply per controller
 * @UseInterceptors(TransformInterceptor)
 * @Controller('assets')
 * export class AssetsController {}
 * ```
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  /**
   * Intercepts the outgoing response and wraps it in a standard ApiResponse format.
   *
   * @param context - The execution context providing access to the HTTP response
   * @param next - The call handler that returns the observable stream from the route handler
   * @returns Observable emitting the wrapped ApiResponse with data, statusCode, and timestamp
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const httpResponse = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(
        (data: T): ApiResponse<T> => ({
          data,
          statusCode: httpResponse.statusCode,
          timestamp: new Date().toISOString(),
        }),
      ),
    );
  }
}
