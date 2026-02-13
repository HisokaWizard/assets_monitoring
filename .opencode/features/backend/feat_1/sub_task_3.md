# Sub-task 3: Unit Tests for JWT Strategy

## Описание
Написать unit тесты для JwtStrategy, покрывающие метод validate().

## Способ решения (используем contextDocs)

Перед реализацией получить контекст:
```typescript
[context_docs: {"layer": "backend", "search": "jwt strategy test"}]
```

### Что тестируем:
1. **validate()**:
   - Успешная валидация с правильным payload
   - Возвращает объект пользователя
   - payload содержит email, sub (userId), role

### Payload структура:
```typescript
{
  email: string;
  sub: number;    // user id
  role: string;
}
```

### Структура теста:
```typescript
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  describe('validate', () => {
    it('should return user object from payload', async () => {
      const payload = { email: 'test@test.com', sub: 1, role: 'user' };
      const result = await strategy.validate(payload);
      
      expect(result).toEqual({
        userId: 1,
        email: 'test@test.com',
        role: 'user',
      });
    });
  });
});
```

## Файл для создания
`backend/src/auth/jwt.strategy.spec.ts`

## Критерии приёмки
- [ ] Тест для validate():
  - [ ] Возвращает объект пользователя из payload
  - [ ] userId берётся из sub
  - [ ] email и role передаются корректно
- [ ] Тесты проходят: `npm test -- jwt.strategy.spec.ts`
