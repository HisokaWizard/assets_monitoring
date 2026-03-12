/**
 * @fileoverview Unit tests for AppModule global providers registration.
 *
 * These tests verify that AppModule registers global providers:
 * - APP_FILTER -> AllExceptionsFilter
 * - APP_INTERCEPTOR -> LoggingInterceptor
 * - APP_INTERCEPTOR -> TransformInterceptor
 *
 * This is RED-phase TDD: tests should FAIL because providers are not yet registered.
 */

import { Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

describe("AppModule", () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe("Global providers registration", () => {
    /**
     * Test that AllExceptionsFilter is registered as global APP_FILTER.
     * This ensures all unhandled exceptions are caught and formatted properly.
     */
    it("should register AllExceptionsFilter as global APP_FILTER", () => {
      const moduleMetadata = reflector.get("metadata", AppModule) as {
        providers?: Array<{ provide: unknown; useClass?: unknown }>;
      };

      const providers = moduleMetadata?.providers || [];
      const appFilter = providers.find(
        (p) =>
          p?.provide === "APP_FILTER" && p?.useClass === AllExceptionsFilter,
      );

      expect(appFilter).toBeDefined();
      expect(appFilter).toEqual(
        expect.objectContaining({
          provide: "APP_FILTER",
          useClass: AllExceptionsFilter,
        }),
      );
    });

    /**
     * Test that LoggingInterceptor is registered as global APP_INTERCEPTOR.
     * This ensures all HTTP requests are logged with method, URL and execution time.
     */
    it("should register LoggingInterceptor as global APP_INTERCEPTOR", () => {
      const moduleMetadata = reflector.get("metadata", AppModule) as {
        providers?: Array<{ provide: unknown; useClass?: unknown }>;
      };

      const providers = moduleMetadata?.providers || [];
      const loggingInterceptor = providers.find(
        (p) =>
          p?.provide === "APP_INTERCEPTOR" &&
          p?.useClass === LoggingInterceptor,
      );

      expect(loggingInterceptor).toBeDefined();
      expect(loggingInterceptor).toEqual(
        expect.objectContaining({
          provide: "APP_INTERCEPTOR",
          useClass: LoggingInterceptor,
        }),
      );
    });

    /**
     * Test that TransformInterceptor is registered as global APP_INTERCEPTOR.
     * This ensures all responses are wrapped in standard ApiResponse format.
     */
    it("should register TransformInterceptor as global APP_INTERCEPTOR", () => {
      const moduleMetadata = reflector.get("metadata", AppModule) as {
        providers?: Array<{ provide: unknown; useClass?: unknown }>;
      };

      const providers = moduleMetadata?.providers || [];
      const transformInterceptor = providers.find(
        (p) =>
          p?.provide === "APP_INTERCEPTOR" &&
          p?.useClass === TransformInterceptor,
      );

      expect(transformInterceptor).toBeDefined();
      expect(transformInterceptor).toEqual(
        expect.objectContaining({
          provide: "APP_INTERCEPTOR",
          useClass: TransformInterceptor,
        }),
      );
    });

    /**
     * Test that all three global providers are present in the module.
     */
    it("should have all global providers registered", () => {
      const moduleMetadata = reflector.get("metadata", AppModule) as {
        providers?: Array<{ provide: unknown; useClass?: unknown }>;
      };

      const providers = moduleMetadata?.providers || [];

      const hasFilter = providers.some((p) => p?.provide === "APP_FILTER");
      const hasInterceptors = providers.filter(
        (p) => p?.provide === "APP_INTERCEPTOR",
      );

      expect(hasFilter).toBe(true);
      expect(hasInterceptors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
