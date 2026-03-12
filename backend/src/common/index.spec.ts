/**
 * Smoke tests for common module barrel exports
 * Tests that all exports from subdirectories are properly re-exported
 */

import {
  AllExceptionsFilter,
  LoggingInterceptor,
  TransformInterceptor,
} from "./index";

import type { ApiResponse } from "./index";

describe("common barrel exports", () => {
  describe("filters", () => {
    it("should export AllExceptionsFilter", () => {
      // Assert: AllExceptionsFilter is defined and is a class
      expect(AllExceptionsFilter).toBeDefined();
      expect(typeof AllExceptionsFilter).toBe("function");
    });
  });

  describe("interceptors", () => {
    it("should export LoggingInterceptor", () => {
      // Assert: LoggingInterceptor is defined and is a class
      expect(LoggingInterceptor).toBeDefined();
      expect(typeof LoggingInterceptor).toBe("function");
    });

    it("should export TransformInterceptor", () => {
      // Assert: TransformInterceptor is defined and is a class
      expect(TransformInterceptor).toBeDefined();
      expect(typeof TransformInterceptor).toBe("function");
    });

    it("should export ApiResponse type", () => {
      // Assert: ApiResponse type is exported and usable
      // If the import succeeds, the type is exported correctly
      const response: ApiResponse<string> = {
        data: "test",
        statusCode: 200,
        timestamp: new Date().toISOString(),
      };
      expect(response.data).toBe("test");
      expect(response.statusCode).toBe(200);
    });
  });
});
