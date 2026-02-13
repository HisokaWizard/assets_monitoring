# TDD Workflow

Test-Driven Development подход на проекте.

## Когда использовать

Всегда при добавлении новой функциональности.

## Цикл Red → Green → Refactor

### 1. Red — Напиши тест

Тест должен:
- Описывать ожидаемое поведение
- Использовать понятные названия
- Проверять один аспект

**Пример:**
```typescript
it('should create asset with valid data', async () => {
  const dto = { type: 'crypto', symbol: 'BTC', amount: 1.5 };
  const result = await service.create(dto);
  expect(result.symbol).toBe('BTC');
});
```

### 2. Green — Минимальный код

Напиши минимум кода, чтобы тест прошёл.
Не стремись к идеалу — стремись к работающему коду.

**Пример:**
```typescript
async create(dto: CreateAssetDto) {
  const asset = this.repository.create(dto);
  return this.repository.save(asset);
}
```

### 3. Refactor — Улучши

Убери дублирование, улучши имена, оптимизируй.
Важно: тесты должны оставаться зелёными!

**Пример:**
```typescript
async create(dto: CreateAssetDto): Promise<Asset> {
  this.logger.log(`Creating asset: ${dto.symbol}`);
  const asset = this.assetsRepository.create(dto);
  return this.assetsRepository.save(asset);
}
```

## Лимиты

Не более 3 итераций рефакторинга, чтобы избежать over-engineering.

## Примеры

**Добавление функции:**
```
Добавь метод для обновления цены актива
→ 1. Тест (Red)
→ 2. Реализация (Green)  
→ 3. Рефакторинг (Refactor)
→ 4. Все тесты проходят ✅
```

**Исправление бага:**
```
Исправь баг: цена не обновляется
→ 1. Тест воспроизводящий баг (Red)
→ 2. Фикс (Green)
→ 3. Проверка (все тесты проходят)
```

## Запуск тестов

```bash
npm test -- имя-файла.spec.ts  # один файл
npm test                      # все тесты
npm run test:watch           # watch mode
npm run test:cov             # с покрытием
```
