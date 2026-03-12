import {
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

/**
 * Factory: creates a mock ArgumentsHost for HTTP context.
 * Returns the host and individual mock objects for assertions.
 */
function createMockHttpArgumentsHost(urlOverride = "/test-path") {
  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockGetRequest = jest.fn().mockReturnValue({
    url: urlOverride,
    method: "GET",
  });
  const mockGetResponse = jest.fn().mockReturnValue({
    status: mockStatus,
  });

  const mockHost = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
      getResponse: mockGetResponse,
    }),
    getArgByIndex: jest.fn(),
    getArgs: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as any;

  return { mockHost, mockStatus, mockJson, mockGetRequest, mockGetResponse };
}

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    // Spy on Logger.prototype.error to verify logging calls
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("when handling HttpException", () => {
    it("should return the correct status code from HttpException", () => {
      // Arrange
      const exception = new NotFoundException("Resource not found");
      const { mockHost, mockStatus, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
        }),
      );
    });

    it("should return string message from HttpException", () => {
      // Arrange
      const exception = new ForbiddenException("Access denied");
      const { mockHost, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.message).toBeDefined();
      // The message should contain the string from the exception
      // HttpException.getResponse() returns either string or object
      const exceptionResponse = exception.getResponse();
      expect(responseBody.message).toEqual(exceptionResponse);
    });

    it("should return object message from HttpException (validation errors)", () => {
      // Arrange
      const validationErrors = {
        statusCode: 400,
        message: ["email must be an email", "password is too short"],
        error: "Bad Request",
      };
      const exception = new BadRequestException(validationErrors.message);
      const { mockHost, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.message).toBeDefined();
      // The message field should be the object response from getResponse()
      const exceptionResponse = exception.getResponse();
      expect(responseBody.message).toEqual(exceptionResponse);
      // Verify it's an object (not a plain string)
      expect(typeof responseBody.message).toBe("object");
    });

    it("should include timestamp in ISO format", () => {
      // Arrange
      const exception = new NotFoundException("Not found");
      const { mockHost, mockJson } = createMockHttpArgumentsHost();
      const beforeTime = new Date().toISOString();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.timestamp).toBeDefined();
      // Validate ISO 8601 format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
      expect(responseBody.timestamp).toMatch(isoRegex);
      // Timestamp should be between before and after the call
      const afterTime = new Date().toISOString();
      expect(responseBody.timestamp >= beforeTime).toBe(true);
      expect(responseBody.timestamp <= afterTime).toBe(true);
    });

    it("should include request path", () => {
      // Arrange
      const exception = new NotFoundException("Not found");
      const requestPath = "/api/assets/123";
      const { mockHost, mockJson } = createMockHttpArgumentsHost(requestPath);

      // Act
      filter.catch(exception, mockHost);

      // Assert
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.path).toBe(requestPath);
    });
  });

  describe("when handling non-HttpException (Error)", () => {
    it("should return 500 Internal Server Error", () => {
      // Arrange
      const exception = new Error("Database connection failed");
      const { mockHost, mockStatus, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        }),
      );
    });

    it("should return generic message without leaking internal details", () => {
      // Arrange
      const internalMessage = "ECONNREFUSED 127.0.0.1:5432 - PostgreSQL down";
      const exception = new Error(internalMessage);
      const { mockHost, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.message).toBe("Internal server error");
      // Must NOT leak internal error details
      expect(responseBody.message).not.toContain("ECONNREFUSED");
      expect(responseBody.message).not.toContain("PostgreSQL");
      expect(JSON.stringify(responseBody)).not.toContain(internalMessage);
    });

    it("should log the error with stack trace via Logger", () => {
      // Arrange
      const exception = new Error("Something went wrong");
      const { mockHost } = createMockHttpArgumentsHost("/api/test");

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(loggerErrorSpy).toHaveBeenCalled();
      // Logger should receive the stack trace
      const loggerCalls = loggerErrorSpy.mock.calls[0];
      const allArgs = loggerCalls.join(" ");
      expect(allArgs).toContain(exception.stack);
    });
  });

  describe("when handling unknown exception types", () => {
    it("should handle non-Error objects (string)", () => {
      // Arrange
      const exception = "Something unexpected happened";
      const { mockHost, mockStatus, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseBody.message).toBe("Internal server error");
      expect(responseBody.timestamp).toBeDefined();
      expect(responseBody.path).toBeDefined();
    });

    it("should handle null exception", () => {
      // Arrange
      const exception = null;
      const { mockHost, mockStatus, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseBody.message).toBe("Internal server error");
    });

    it("should handle undefined exception", () => {
      // Arrange
      const exception = undefined;
      const { mockHost, mockStatus, mockJson } = createMockHttpArgumentsHost();

      // Act
      filter.catch(exception, mockHost);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const responseBody = mockJson.mock.calls[0][0];
      expect(responseBody.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(responseBody.message).toBe("Internal server error");
    });
  });
});
