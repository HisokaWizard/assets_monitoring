import { Logger } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { LoggingInterceptor } from "./logging.interceptor";

/**
 * Factory: creates a mock ExecutionContext for HTTP context.
 * Returns the context and individual mock objects for assertions.
 */
function createMockExecutionContext(method = "GET", url = "/api/assets") {
  const mockRequest = { method, url };

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as any;

  return { mockContext, mockRequest };
}

/**
 * Factory: creates a mock CallHandler that returns the given value.
 */
function createMockCallHandler(returnValue: unknown = { data: "test" }) {
  return {
    handle: jest.fn().mockReturnValue(of(returnValue)),
  } as any;
}

/**
 * Factory: creates a mock CallHandler that throws the given error.
 */
function createMockErrorCallHandler(error: Error) {
  return {
    handle: jest.fn().mockReturnValue(throwError(() => error)),
  } as any;
}

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    loggerLogSpy = jest
      .spyOn(Logger.prototype, "log")
      .mockImplementation(() => undefined);
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when handling successful requests", () => {
    it("should call next.handle() and read request context", (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext();
      const mockHandler = createMockCallHandler({ id: 1 });

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        complete: () => {
          // Assert
          expect(mockHandler.handle).toHaveBeenCalledTimes(1);
          // Interceptor must access HTTP context to read request details
          expect(mockContext.switchToHttp).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should log method and URL with execution time in format "GET /api/assets - Xms"', (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext("GET", "/api/assets");
      const mockHandler = createMockCallHandler({ id: 1 });

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        complete: () => {
          // Assert
          expect(loggerLogSpy).toHaveBeenCalledTimes(1);
          const logMessage = loggerLogSpy.mock.calls[0][0];
          // Should match format: "GET /api/assets - Xms"
          expect(logMessage).toMatch(/^GET \/api\/assets - \d+ms$/);
          done();
        },
      });
    });

    it("should log POST method and different URL correctly", (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext("POST", "/api/users");
      const mockHandler = createMockCallHandler({ created: true });

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        complete: () => {
          // Assert
          expect(loggerLogSpy).toHaveBeenCalledTimes(1);
          const logMessage = loggerLogSpy.mock.calls[0][0];
          expect(logMessage).toMatch(/^POST \/api\/users - \d+ms$/);
          done();
        },
      });
    });

    it("should pass response data through without modification", (done) => {
      // Arrange
      const responseData = { id: 42, name: "Bitcoin", price: 50000 };
      const { mockContext } = createMockExecutionContext("GET", "/api/crypto");
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (value) => {
          // Assert — data must pass through unchanged
          expect(value).toEqual(responseData);
        },
        complete: () => {
          // Assert — logging must still happen even when checking data passthrough
          expect(loggerLogSpy).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe("when handling error requests", () => {
    it("should log error request with execution time", (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext(
        "DELETE",
        "/api/assets/1",
      );
      const error = new Error("Not found");
      const mockHandler = createMockErrorCallHandler(error);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: () => {
          // Assert
          expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
          const logMessage = loggerErrorSpy.mock.calls[0][0];
          expect(logMessage).toMatch(/^DELETE \/api\/assets\/1 - \d+ms$/);
          done();
        },
      });
    });

    it("should propagate the original error after logging", (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext(
        "PUT",
        "/api/assets/5",
      );
      const originalError = new Error("Database connection failed");
      const mockHandler = createMockErrorCallHandler(originalError);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: (err) => {
          // Assert — error must be the original one
          expect(err).toBe(originalError);
          expect(err.message).toBe("Database connection failed");
          // Assert — error logging must happen before propagation
          expect(loggerErrorSpy).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe("when measuring execution time", () => {
    it("should measure time between request start and response", (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext("GET", "/api/slow");
      const mockHandler = createMockCallHandler("ok");

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        complete: () => {
          // Assert
          expect(loggerLogSpy).toHaveBeenCalledTimes(1);
          const logMessage: string = loggerLogSpy.mock.calls[0][0];
          // Extract the time value from the log message
          const timeMatch = logMessage.match(/(\d+)ms$/);
          expect(timeMatch).not.toBeNull();
          const elapsedMs = parseInt(timeMatch![1], 10);
          // Elapsed time should be a non-negative number
          expect(elapsedMs).toBeGreaterThanOrEqual(0);
          done();
        },
      });
    });
  });
});
