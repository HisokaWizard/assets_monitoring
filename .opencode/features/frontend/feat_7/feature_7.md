# Feature 7: Страница токенов с редактируемой таблицей

## Описание

Реализация страницы токенов с:
- Редактируемой таблицей токенов пользователя
- Добавлением нового токена с полями: тикер, количество монет, средняя цена покупки
- Расчетными полями: текущая цена, P/L, процент изменения
- Автоматическим получением цены при создании токена, если текущая цена не указана
- Кнопкой обновления всех монет пользователя
- Обновлением данных при заходе на страницу и по кнопке

## Контекст

### Стек
- **Frontend**: React 18+, TypeScript 5+, Material UI 6, React Router 6, Redux Toolkit
- **Backend**: NestJS с TypeORM, PostgreSQL
- **Архитектура**: FSD (Feature-Sliced Design)

### Существующие API (Backend)

#### Assets (`/assets`)
- `GET /assets` - получить все активы пользователя
- `GET /assets/:id` - получить актив по ID
- `POST /assets` - создать актив
- `PUT /assets/:id` - обновить актив
- `DELETE /assets/:id` - удалить актив
- ✅ Защищен JWT Guard

### Модели данных

**CryptoAsset:**
```typescript
{
  id: number;
  type: 'crypto';
  symbol: string;           // Тикер (BTC, ETH)
  fullName: string;         // Полное название (Bitcoin)
  amount: number;           // Количество монет
  middlePrice: number;      // Средняя цена покупки
  currentPrice: number;     // Текущая цена
  previousPrice: number;    // Предыдущая цена
  multiple: number;         // Множитель (текущая/средняя)
  dailyChange: number;      // Изменение за день (%)
  weeklyChange: number;     // Изменение за неделю (%)
  monthlyChange: number;    // Изменение за месяц (%)
  quartChange: number;      // Изменение за квартал (%)
  yearChange: number;       // Изменение за год (%)
  totalChange: number;      // Общее изменение (%)
  dailyPrice: number;      // Цена за день
  weeklyPrice: number;      // Цена за неделю
  monthlyPrice: number;     // Цена за месяц
  quartPrice: number;       // Цена за квартал
  yearPrice: number;        // Цена за год
  dailyTimestamp: Date;
  weeklyTimestamp: Date;
  monthlyTimestamp: Date;
  quartTimestamp: Date;
  yearTimestamp: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Calculated fields:**
- `totalValue` = amount * currentPrice (текущая стоимость)
- `totalInvested` = amount * middlePrice (вложено)
- `profitLoss` = totalValue - totalInvested (прибыль/убыток)
- `profitLossPercent` = ((currentPrice - middlePrice) / middlePrice) * 100 (%)

## Декомпозиция

### Sub-task 1: Добавить API эндпоинт для получения цены монеты
Добавить метод в assets.service.ts для получения текущей цены монеты по символу через CoinMarketCap API.

- **Сложность**: Medium
- **Зависимости**: Нет
- **Слой**: Backend

### Sub-task 2: Обновить создание актива с автоматическим получением цены
Модифицировать create метод в assets.service.ts для вызова получения цены, если currentPrice не передан.

- **Сложность**: Medium
- **Зависимости**: Sub-task 1
- **Слой**: Backend

### Sub-task 3: Добавить эндпоинт для обновления всех активов пользователя
Добавить POST /assets/refresh для ручного обновления всех активов пользователя.

- **Сложность**: Medium
- **Зависимости**: Sub-task 2
- **Слой**: Backend

### Sub-task 4: Создать entity assets на frontend
Создать RTK Query API для /assets и типы для CryptoAsset.

- **Сложность**: Medium
- **Зависимости**: Нет
- **Слой**: Frontend (entities/assets)

### Sub-task 5: Реализовать TokensPage с редактируемой таблицей
Обновить TokensPage с:
- Таблицей токенов с редактируемыми ячейками
- Формой добавления нового токена
- Кнопкой обновления котировок
- Автоматическим обновлением при монтировании

- **Сложность**: High
- **Зависимости**: Sub-task 3, Sub-task 4
- **Слой**: Frontend (pages/tokens)

## Ожидаемый результат

1. Пользователь может видеть все свои токены в таблице
2. Пользователь может добавить новый токен (тикер, количество, средняя цена)
3. При создании токена автоматически получается текущая цена
4. Все расчетные поля (P/L, %) корректно отображаются
5. Кнопка "Обновить котировки" обновляет все токены пользователя
6. Данные автоматически обновляются при заходе на страницу

## Риски

- CoinMarketCap API может быть недоступен - нужно обработать ошибку
- При отсутствии API ключа пользователя обновление не сработает
- Большое количество токенов может замедлить обновление

## Критерии приёмки

- [ ] Unit тесты покрывают все новые компоненты
- [ ] E2E тест проверяет полный сценарий работы с токенами
- [ ] Все обязательные поля валидируются
- [ ] Ошибки API корректно отображаются пользователю
