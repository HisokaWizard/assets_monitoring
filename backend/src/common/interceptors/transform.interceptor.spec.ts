import { of } from "rxjs";
import { TransformInterceptor, ApiResponse } from "./transform.interceptor";

/**
 * Factory: creates a mock ExecutionContext for HTTP context.
 * Returns the context with configurable statusCode.
 */
function createMockExecutionContext(statusCode = 200) {
  const mockResponse = { statusCode };

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue({}),
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
  } as any;

  return { mockContext, mockResponse };
}

/**
 * Factory: creates a mock CallHandler that returns the given value.
 */
function createMockCallHandler(...args: unknown[]) {
  const returnValue = args.length > 0 ? args[0] : { data: "test" };
  return {
    handle: jest.fn().mockReturnValue(of(returnValue)),
  } as any;
}

describe("TransformInterceptor", () => {
  let interceptor: TransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  describe("when handling object data", () => {
    it("should wrap response in ApiResponse format { data, statusCode, timestamp }", (done) => {
      // Arrange
      const responseData = { id: 1, name: "Bitcoin", price: 50000 };
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result).toHaveProperty("data");
          expect(result).toHaveProperty("statusCode");
          expect(result).toHaveProperty("timestamp");
          expect(result.data).toEqual(responseData);
          done();
        },
      });
    });

    it("should include correct statusCode from HTTP response", (done) => {
      // Arrange
      const responseData = { created: true };
      const { mockContext } = createMockExecutionContext(201);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result.statusCode).toBe(201);
          done();
        },
      });
    });

    it("should include timestamp in ISO format", (done) => {
      // Arrange
      const responseData = { id: 1 };
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert — ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
          expect(result.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
          );
          done();
        },
      });
    });
  });

  describe("when handling array data", () => {
    it("should wrap array in ApiResponse", (done) => {
      // Arrange
      const responseData = [
        { id: 1, name: "Bitcoin" },
        { id: 2, name: "Ethereum" },
      ];
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toEqual(responseData);
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.statusCode).toBe(200);
          expect(result).toHaveProperty("timestamp");
          done();
        },
      });
    });

    it("should wrap empty array in ApiResponse", (done) => {
      // Arrange
      const responseData: unknown[] = [];
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toEqual([]);
          expect(Array.isArray(result.data)).toBe(true);
          expect(result.statusCode).toBe(200);
          done();
        },
      });
    });
  });

  describe("when handling null/undefined data", () => {
    it("should wrap null in ApiResponse", (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(null);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toBeNull();
          expect(result.statusCode).toBe(200);
          expect(result).toHaveProperty("timestamp");
          done();
        },
      });
    });

    it("should wrap undefined in ApiResponse", (done) => {
      // Arrange
      const { mockContext } = createMockExecutionContext(204);
      const mockHandler = createMockCallHandler(undefined);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toBeUndefined();
          expect(result.statusCode).toBe(204);
          expect(result).toHaveProperty("timestamp");
          done();
        },
      });
    });
  });

  describe("when handling primitive data", () => {
    it("should wrap string in ApiResponse", (done) => {
      // Arrange
      const responseData = "Operation successful";
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toBe("Operation successful");
          expect(result.statusCode).toBe(200);
          expect(result).toHaveProperty("timestamp");
          done();
        },
      });
    });

    it("should wrap number in ApiResponse", (done) => {
      // Arrange
      const responseData = 42;
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toBe(42);
          expect(result.statusCode).toBe(200);
          expect(result).toHaveProperty("timestamp");
          done();
        },
      });
    });
  });

  describe("ApiResponse interface", () => {
    it("should have data, statusCode, and timestamp fields", (done) => {
      // Arrange
      const responseData = { test: true };
      const { mockContext } = createMockExecutionContext(200);
      const mockHandler = createMockCallHandler(responseData);

      // Act
      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: (result) => {
          // Assert — verify all three required fields exist
          const keys = Object.keys(result);
          expect(keys).toContain("data");
          expect(keys).toContain("statusCode");
          expect(keys).toContain("timestamp");
          // Assert — verify no extra fields
          expect(keys).toHaveLength(3);
          done();
        },
      });
    });
  });
});
