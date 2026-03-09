/**
 * @fileoverview Тесты для AuthModule - валидация JWT_SECRET
 *
 * Тестирует механизм проверки переменной окружения JWT_SECRET при инициализации модуля.
 * Следует принципам TDD: сначала тесты (RED), затем реализация (GREEN).
 *
 * В RED-фазе тесты ожидают:
 * - onModuleInit() должен проверять наличие JWT_SECRET
 * - При отсутствии JWT_SECRET - выбрасывать ошибку
 * - Не использовать fallback 'secret' для безопасности
 */

import { AuthModule } from "./auth.module";

describe("AuthModule", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  /**
   * Вспомогательная функция для вызова onModuleInit.
   * В RED-фазе метод не реализован, поэтому всегда выбрасывает ошибку.
   */
  const callOnModuleInit = (module: AuthModule): Promise<void> => {
    const method = (module as any).onModuleInit;
    if (typeof method !== "function") {
      return Promise.reject(new Error("onModuleInit is not implemented"));
    }
    return method.call(module);
  };

  describe("onModuleInit validation", () => {
    /**
     * Тест: when JWT_SECRET is not set
     *
     * Ожидание: onModuleInit() должен бросить ошибку с 'JWT_SECRET'
     * в сообщении, указывая на необходимость настройки переменной окружения.
     *
     * В RED-фазе этот тест падает, потому что метод onModuleInit()
     * ещё не реализован в AuthModule.
     */
    it("when JWT_SECRET is not set - should throw error with JWT_SECRET in message", async () => {
      // Arrange: Удаляем JWT_SECRET из переменных окружения
      delete process.env.JWT_SECRET;

      // Создаём экземпляр модуля
      const authModule = new AuthModule();

      // Act & Assert: При инициализации должна выбрасываться ошибка с 'JWT_SECRET'
      // RED-фаза: тест падает, потому что метод не реализован
      await expect(callOnModuleInit(authModule)).rejects.toThrow("JWT_SECRET");
    });

    /**
     * Тест: when JWT_SECRET is set
     *
     * Ожидание: onModuleInit() не должен бросать ошибку,
     * когда JWT_SECRET корректно установлен в переменных окружения.
     *
     * В RED-фазе этот тест падает, потому что метод onModuleInit()
     * ещё не реализован и выбрасывает 'onModuleInit is not implemented'.
     */
    it("when JWT_SECRET is set - should NOT throw error", async () => {
      // Arrange: Устанавливаем валидный JWT_SECRET
      process.env.JWT_SECRET = "test-secret-key-12345";

      // Создаём экземпляр модуля
      const authModule = new AuthModule();

      // Act & Assert: При инициализации не должно быть ошибки
      // RED-фаза: тест падает, потому что метод не реализован
      await expect(callOnModuleInit(authModule)).resolves.not.toThrow();
    });
  });

  describe("fallback validation", () => {
    /**
     * Тест: should NOT use fallback 'secret'
     *
     * Ожидание: Код НЕ должен использовать fallback значение 'secret'.
     * Это важно для безопасности - нельзя использовать предсказуемые secrets.
     * Данный тест проверяет, что при отсутствии JWT_SECRET выбрасывается ошибка,
     * а не используется небезопасный fallback.
     *
     * В текущей реализации AuthModule используется:
     *   secret: process.env.JWT_SECRET || 'secret'
     * Это небезопасно и должно быть исправлено.
     *
     * В RED-фазе тест падает, потому что метод onModuleInit не реализован.
     */
    it("should NOT use fallback secret - should throw when JWT_SECRET is missing", async () => {
      // Arrange: Удаляем JWT_SECRET
      delete process.env.JWT_SECRET;

      // Создаём экземпляр модуля
      const authModule = new AuthModule();

      // Act & Assert: Должна быть ошибка с 'JWT_SECRET', а не использование fallback
      // Если бы использовался fallback 'secret', ошибка бы не выбрасывалась
      // RED-фаза: тест падает, потому что метод не реализован
      await expect(callOnModuleInit(authModule)).rejects.toThrow("JWT_SECRET");
    });
  });
});
