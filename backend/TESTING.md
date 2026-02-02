# Инструкция по тестированию сервера Assets Monitoring

## 1. Введение

Assets Monitoring — это backend-приложение для мониторинга криптовалютных активов и NFT. Система позволяет пользователям отслеживать стоимость своих активов, получать уведомления о значимых изменениях цен и генерировать отчеты.

### Технологический стек

- **NestJS** — основной фреймворк
- **TypeORM** — ORM для работы с базой данных
- **SQLite** — встроенная база данных
- **JWT** — аутентификация и авторизация
- **Passport** — стратегии аутентификации

### Структура проекта

```
backend/
├── src/
│   ├── auth/           # Модуль аутентификации
│   ├── assets/         # Модуль управления активами
│   ├── notifications/  # Модуль уведомлений
│   ├── app.module.ts   # Главный модуль приложения
│   ├── main.ts         # Точка входа
│   └── seed.ts         # Скрипт заполнения БД тестовыми данными
├── database.sqlite     # Файл базы данных SQLite
└── package.json        # Зависимости проекта
```

---

## 2. Запуск сервера

### 2.1. Установка зависимостей

Перед первым запуском необходимо установить все зависимости:

```bash
cd backend
npm install
```

### 2.2. Запуск dev сервера

Для запуска сервера в режиме разработки:

```bash
npm run start:dev
```

Сервер будет доступен по адресу: `http://localhost:3000`

### 2.3. Запуск seed скрипта

Для заполнения базы данных тестовыми пользователями:

```bash
npm run seed
```

Скрипт создаст тестовых пользователей с предопределенными данными.

---

## 3. Тестовые пользователи

После выполнения `npm run seed` в базе данных создаются следующие пользователи:

| Email             | Пароль   | Роль  | Описание                        |
| ----------------- | -------- | ----- | ------------------------------- |
| admin@example.com | admin123 | admin | Администратор с полным доступом |
| user@example.com  | user123  | user  | Обычный пользователь            |

### Права доступа

- **Admin** — полный доступ ко всем эндпоинтам
- **User** — доступ только к своим данным и активам

---

## 4. Тестирование API Endpoints

### 4.1. Auth Module

#### POST /auth/register

Регистрация нового пользователя.

**Параметры запроса:**

```json
{
  "email": "string",
  "password": "string",
  "name": "string"
}
```

**Пример запроса:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "password123", "name": "New User"}'
```

**Ожидаемый ответ (201 Created):**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "newuser@example.com",
    "name": "New User",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### POST /auth/login

Аутентификация пользователя и получение JWT токена.

**Параметры запроса:**

```json
{
  "email": "string",
  "password": "string"
}
```

**Пример запроса:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

**Ожидаемый ответ (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

> **Важно:** Сохраните полученный `access_token` для последующих запросов, требующих аутентификации.

---

#### GET /auth/profile

Получение профиля текущего пользователя.

**Требования:** Требуется JWT токен в заголовке Authorization.

**Пример запроса:**

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "id": 1,
  "email": "admin@example.com",
  "name": "Admin",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Возможные ошибки:**

- `401 Unauthorized` — токен отсутствует или недействителен

---

### 4.2. Assets Module

Все эндпоинты модуля активов требуют аутентификации.

#### GET /assets

Получение всех активов текущего пользователя.

**Пример запроса:**

```bash
curl -X GET http://localhost:3000/assets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "type": "crypto",
      "symbol": "BTC",
      "name": "Bitcoin",
      "amount": 1.5,
      "purchasePrice": 45000,
      "currentPrice": 50000,
      "purchaseDate": "2024-01-01T00:00:00.000Z",
      "userId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Параметры запроса (опционально):**

| Параметр | Тип    | Описание                            |
| -------- | ------ | ----------------------------------- |
| type     | string | Фильтр по типу актива (crypto, nft) |
| symbol   | string | Фильтр по символу                   |

**Пример с фильтрами:**

```bash
curl -X GET "http://localhost:3000/assets?type=crypto&symbol=BTC" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

#### GET /assets/:id

Получение актива по ID.

**Пример запроса:**

```bash
curl -X GET http://localhost:3000/assets/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "id": 1,
  "type": "crypto",
  "symbol": "BTC",
  "name": "Bitcoin",
  "amount": 1.5,
  "purchasePrice": 45000,
  "currentPrice": 50000,
  "purchaseDate": "2024-01-01T00:00:00.000Z",
  "userId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

**Возможные ошибки:**

- `404 Not Found` — актив не найден
- `403 Forbidden` — доступ к чужому активу запрещен

---

#### POST /assets

Создание нового актива.

**Параметры запроса:**

```json
{
  "type": "crypto" | "nft",
  "symbol": "string",
  "name": "string",
  "amount": "number",
  "purchasePrice": "number",
  "purchaseDate": "string (ISO 8601)",
  "description": "string (опционально)"
}
```

**Пример запроса:**

```bash
curl -X POST http://localhost:3000/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "crypto",
    "symbol": "ETH",
    "name": "Ethereum",
    "amount": 10,
    "purchasePrice": 3000,
    "purchaseDate": "2024-01-15T00:00:00.000Z",
    "description": "Ethereum для долгосрочного хранения"
  }'
```

**Ожидаемый ответ (201 Created):**

```json
{
  "message": "Asset created successfully",
  "data": {
    "id": 2,
    "type": "crypto",
    "symbol": "ETH",
    "name": "Ethereum",
    "amount": 10,
    "purchasePrice": 3000,
    "currentPrice": null,
    "purchaseDate": "2024-01-15T00:00:00.000Z",
    "userId": 1,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Пример для NFT:**

```bash
curl -X POST http://localhost:3000/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "nft",
    "symbol": "BAYC",
    "name": "Bored Ape Yacht Club #1234",
    "amount": 1,
    "purchasePrice": 800000,
    "purchaseDate": "2024-02-01T00:00:00.000Z"
  }'
```

---

#### PATCH /assets/:id

Обновление существующего актива.

**Параметры запроса (все опциональны):**

```json
{
  "symbol": "string",
  "name": "string",
  "amount": "number",
  "purchasePrice": "number",
  "purchaseDate": "string (ISO 8601)",
  "description": "string"
}
```

**Пример запроса:**

```bash
curl -X PATCH http://localhost:3000/assets/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "purchasePrice": 48000,
    "amount": 2
  }'
```

**Ожидаемый ответ (200 OK):**

```json
{
  "message": "Asset updated successfully",
  "data": {
    "id": 1,
    "type": "crypto",
    "symbol": "BTC",
    "name": "Bitcoin",
    "amount": 2,
    "purchasePrice": 48000,
    "currentPrice": 50000,
    "purchaseDate": "2024-01-01T00:00:00.000Z",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

#### DELETE /assets/:id

Удаление актива.

**Пример запроса:**

```bash
curl -X DELETE http://localhost:3000/assets/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "message": "Asset deleted successfully"
}
```

**Возможные ошибки:**

- `404 Not Found` — актив не найден
- `403 Forbidden` — попытка удалить чужой актив

---

### 4.3. Notifications Module

#### GET /notifications/settings

Получение настроек уведомлений текущего пользователя.

**Пример запроса:**

```bash
curl -X GET http://localhost:3000/notifications/settings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "type": "price_alert",
      "threshold": 10,
      "symbol": "BTC",
      "isEnabled": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

---

#### POST /notifications/settings

Создание новых настроек уведомлений.

**Параметры запроса:**

```json
{
  "type": "price_alert" | "portfolio_update" | "news",
  "threshold": "number",
  "symbol": "string",
  "isEnabled": "boolean"
}
```

**Пример запроса:**

```bash
curl -X POST http://localhost:3000/notifications/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "price_alert",
    "threshold": 5,
    "symbol": "ETH",
    "isEnabled": true
  }'
```

**Ожидаемый ответ (201 Created):**

```json
{
  "message": "Notification settings created successfully",
  "data": {
    "id": 2,
    "userId": 1,
    "type": "price_alert",
    "threshold": 5,
    "symbol": "ETH",
    "isEnabled": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### PATCH /notifications/settings/:id

Обновление настроек уведомлений.

**Пример запроса:**

```bash
curl -X PATCH http://localhost:3000/notifications/settings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"threshold": 15, "isEnabled": false}'
```

**Ожидаемый ответ (200 OK):**

```json
{
  "message": "Notification settings updated successfully",
  "data": {
    "id": 1,
    "userId": 1,
    "type": "price_alert",
    "threshold": 15,
    "symbol": "BTC",
    "isEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

#### DELETE /notifications/settings/:id

Удаление настроек уведомлений.

**Пример запроса:**

```bash
curl -X DELETE http://localhost:3000/notifications/settings/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "message": "Notification settings deleted successfully"
}
```

---

#### GET /notifications/history

Получение истории отправленных уведомлений.

**Пример запроса:**

```bash
curl -X GET http://localhost:3000/notifications/history \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "type": "price_alert",
      "message": "Цена BTC выросла на 10%",
      "isRead": false,
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

---

#### POST /notifications/report

Генерация отчета о портфеле.

**Параметры запроса:**

```json
{
  "format": "pdf" | "csv" | "json",
  "period": "week" | "month" | "year" | "all",
  "includePrices": "boolean"
}
```

**Пример запроса:**

```bash
curl -X POST http://localhost:3000/notifications/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "format": "json",
    "period": "month",
    "includePrices": true
  }'
```

**Ожидаемый ответ (200 OK):**

```json
{
  "message": "Report generated successfully",
  "data": {
    "reportUrl": "/reports/portfolio_2024_01.json",
    "generatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

#### POST /notifications/trigger-updates

Ручной запуск обновления цен активов (требует роль admin).

**Пример запроса:**

```bash
curl -X POST http://localhost:3000/notifications/trigger-updates \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Ожидаемый ответ (200 OK):**

```json
{
  "message": "Price update triggered successfully",
  "updatedAssets": 10
}
```

**Возможные ошибки:**

- `403 Forbidden` — доступ запрещен для пользователей без роли admin

---

## 5. Работа с базой данных SQLite

### 5.1. Путь к файлу БД

Файл базы данных находится по следующему пути:

```
backend/database.sqlite
```

### 5.2. Просмотр данных

#### Использование sqlite3 CLI

Откройте терминал и выполните:

```bash
cd backend
sqlite3 database.sqlite
```

После запуска sqlite3 вы увидите приглашение `sqlite>`. Теперь можно выполнять SQL-запросы.

**Примеры запросов:**

```sql
-- Просмотр всех пользователей
SELECT * FROM users;

-- Просмотр всех активов
SELECT * FROM assets;

-- Просмотр настроек уведомлений
SELECT * FROM notification_settings;

-- Просмотр истории уведомлений
SELECT * FROM notification_logs;

-- Выход из sqlite3
.quit
```

#### Использование DB Browser for SQLite

1. Скачайте и установите [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Запустите приложение
3. Нажмите "Open Database"
4. Выберите файл `backend/database.sqlite`
5. Теперь вы можете просматривать таблицы, выполнять SQL-запросы и редактировать данные через графический интерфейс

### 5.3. Добавление данных

```sql
-- Добавление нового пользователя
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('test@example.com', 'hashed_password', 'Test User', 'user', datetime('now'), datetime('now'));

-- Добавление нового актива
INSERT INTO assets (type, symbol, name, amount, "purchasePrice", "currentPrice", "purchaseDate", "userId", "createdAt", "updatedAt")
VALUES ('crypto', 'SOL', 'Solana', 100, 20, 100, '2024-01-01', 1, datetime('now'), datetime('now'));
```

### 5.4. Изменение данных

```sql
-- Изменение цены актива
UPDATE assets SET "currentPrice" = 55000, "updatedAt" = datetime('now') WHERE id = 1;

-- Изменение пароля пользователя
UPDATE users SET password = 'new_hashed_password' WHERE id = 1;
```

### 5.5. Удаление данных

```sql
-- Удаление актива
DELETE FROM assets WHERE id = 1;

-- Удаление пользователя
DELETE FROM users WHERE id = 1;
```

### 5.6. Полезные SQL-запросы

```sql
-- Получить все активы пользователя с расчетом прибыли/убытка
SELECT
  id,
  symbol,
  name,
  amount,
  "purchasePrice",
  "currentPrice",
  (("currentPrice" - "purchasePrice") * amount) as profit_loss
FROM assets
WHERE "userId" = 1;

-- Получить активы с уведомлениями
SELECT a.*, ns.type, ns.threshold, ns."isEnabled"
FROM assets a
JOIN notification_settings ns ON a.symbol = ns.symbol
WHERE a."userId" = 1;

-- Статистика по типам активов
SELECT
  type,
  COUNT(*) as count,
  SUM(amount * "purchasePrice") as total_invested
FROM assets
WHERE "userId" = 1
GROUP BY type;

-- Непрочитанные уведомления
SELECT * FROM notification_logs
WHERE "userId" = 1 AND "isRead" = 0
ORDER BY "createdAt" DESC;
```

---

## 6. Использование curl и Postman для тестирования

### 6.1. Примеры curl запросов

#### Получение токена и сохранение в переменную

```bash
# Получение токена
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' | jq -r '.access_token')

echo "Token: $TOKEN"
```

#### GET запрос с токеном

```bash
# Использование токена в запросе
curl -X GET http://localhost:3000/assets \
  -H "Authorization: Bearer $TOKEN"
```

#### Создание актива с использованием токена

```bash
curl -X POST http://localhost:3000/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "crypto",
    "symbol": "DOT",
    "name": "Polkadot",
    "amount": 500,
    "purchasePrice": 10,
    "purchaseDate": "2024-02-01T00:00:00.000Z"
  }'
```

### 6.2. Настройка Postman

#### Создание коллекции

1. Откройте Postman и создайте новую коллекцию "Assets Monitoring"
2. Добавьте переменные коллекции:
   - `baseUrl`: `http://localhost:3000`
   - `accessToken`: (оставьте пустой, будет заполняться динамически)

#### Pre-request Script для авторизации

Добавьте следующий скрипт в pre-request коллекции для автоматического получения токена:

```javascript
// Получаем текущий токен
const token = pm.collectionVariables.get('accessToken');

if (!token) {
  const loginRequest = {
    url: pm.collectionVariables.get('baseUrl') + '/auth/login',
    method: 'POST',
    header: {
      'Content-Type': 'application/json',
    },
    body: {
      mode: 'raw',
      raw: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
      }),
    },
  };

  pm.sendRequest(loginRequest, (err, response) => {
    if (err) {
      console.error('Login failed:', err);
      return;
    }

    const jsonResponse = response.json();
    pm.collectionVariables.set('access_token', jsonResponse.access_token);
    console.log('Token refreshed:', jsonResponse.access_token);
  });
}
```

#### Примеры запросов в Postman

**POST /auth/login:**

- URL: `{{baseUrl}}/auth/login`
- Body (raw JSON):

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

- Tests:

```javascript
const jsonResponse = pm.response.json();
pm.collectionVariables.set('access_token', jsonResponse.access_token);
```

**GET /assets:**

- URL: `{{baseUrl}}/assets`
- Headers: `Authorization: Bearer {{access_token}}`

**POST /assets:**

- URL: `{{baseUrl}}/assets`
- Headers: `Authorization: Bearer {{access_token}}`
- Body (raw JSON):

```json
{
  "type": "crypto",
  "symbol": "LINK",
  "name": "Chainlink",
  "amount": 100,
  "purchasePrice": 15,
  "purchaseDate": "2024-02-01T00:00:00.000Z"
}
```

---

## 7. Структура файла базы данных

### 7.1. Схема таблиц

#### users (Пользователи)

| Поле      | Тип      | Ограничения               | Описание                       |
| --------- | -------- | ------------------------- | ------------------------------ |
| id        | INTEGER  | PRIMARY KEY AUTOINCREMENT | Идентификатор пользователя     |
| email     | TEXT     | UNIQUE, NOT NULL          | Email пользователя             |
| password  | TEXT     | NOT NULL                  | Хешированный пароль            |
| name      | TEXT     | NOT NULL                  | Имя пользователя               |
| role      | TEXT     | DEFAULT 'user'            | Роль пользователя (user/admin) |
| createdAt | DATETIME | NOT NULL                  | Дата создания                  |
| updatedAt | DATETIME | NOT NULL                  | Дата обновления                |

#### assets (Активы)

| Поле          | Тип      | Ограничения                      | Описание                      |
| ------------- | -------- | -------------------------------- | ----------------------------- |
| id            | INTEGER  | PRIMARY KEY AUTOINCREMENT        | Идентификатор актива          |
| userId        | INTEGER  | FOREIGN KEY REFERENCES users(id) | Владелец актива               |
| type          | TEXT     | NOT NULL                         | Тип актива (crypto/nft)       |
| symbol        | TEXT     | NOT NULL                         | Символ актива (BTC, ETH, NFT) |
| name          | TEXT     | NOT NULL                         | Название актива               |
| amount        | REAL     | NOT NULL                         | Количество                    |
| purchasePrice | REAL     | NOT NULL                         | Цена покупки                  |
| currentPrice  | REAL     | NULL                             | Текущая цена                  |
| purchaseDate  | DATETIME | NOT NULL                         | Дата покупки                  |
| description   | TEXT     | NULL                             | Описание                      |
| createdAt     | DATETIME | NOT NULL                         | Дата создания                 |
| updatedAt     | DATETIME | NOT NULL                         | Дата обновления               |

#### notification_settings (Настройки уведомлений)

| Поле      | Тип      | Ограничения                      | Описание               |
| --------- | -------- | -------------------------------- | ---------------------- |
| id        | INTEGER  | PRIMARY KEY AUTOINCREMENT        | Идентификатор настроек |
| userId    | INTEGER  | FOREIGN KEY REFERENCES users(id) | Пользователь           |
| type      | TEXT     | NOT NULL                         | Тип уведомления        |
| threshold | REAL     | NOT NULL                         | Порог срабатывания     |
| symbol    | TEXT     | NOT NULL                         | Символ актива          |
| isEnabled | BOOLEAN  | DEFAULT true                     | Включено/выключено     |
| createdAt | DATETIME | NOT NULL                         | Дата создания          |
| updatedAt | DATETIME | NOT NULL                         | Дата обновления        |

#### notification_logs (История уведомлений)

| Поле      | Тип      | Ограничения                      | Описание               |
| --------- | -------- | -------------------------------- | ---------------------- |
| id        | INTEGER  | PRIMARY KEY AUTOINCREMENT        | Идентификатор записи   |
| userId    | INTEGER  | FOREIGN KEY REFERENCES users(id) | Пользователь           |
| type      | TEXT     | NOT NULL                         | Тип уведомления        |
| message   | TEXT     | NOT NULL                         | Текст уведомления      |
| isRead    | BOOLEAN  | DEFAULT false                    | Прочитано/не прочитано |
| createdAt | DATETIME | NOT NULL                         | Дата создания          |

### 7.2. Связи между таблицами

```
users (1) ----< (N) assets
users (1) ----< (N) notification_settings
users (1) ----< (N) notification_logs
```

### 7.3. Создание диаграммы ER

Для визуализации структуры базы данных можно использовать следующий SQL:

```sql
-- Создание диаграммы в формате ASCII
SELECT
    'users' as table_name,
    'id, email, password, name, role' as columns
UNION ALL SELECT
    'assets',
    'id, userId, type, symbol, name, amount, purchasePrice, currentPrice'
UNION ALL SELECT
    'notification_settings',
    'id, userId, type, threshold, symbol, isEnabled'
UNION ALL SELECT
    'notification_logs',
    'id, userId, type, message, isRead';
```

---

## 8. Полезные команды для разработки

### Сброс и пересоздание базы данных

```bash
# Удаление файла базы данных
rm backend/database.sqlite

# Запуск сервера (автоматически создаст новую БД)
npm run start:dev

# В другом терминале: запуск seed
npm run seed
```

### Логирование

Для просмотра подробных логов добавьте переменную окружения:

```bash
DEBUG=* npm run start:dev
```

---

## 9. Частые ошибки и их решения

### Ошибка 401 Unauthorized

**Причина:** Токен истек или отсутствует в заголовке.

**Решение:**

1. Выполните POST /auth/login заново для получения нового токена
2. Убедитесь, что заголовок имеет формат: `Authorization: Bearer <token>`

### Ошибка 403 Forbidden

**Причина:** Попытка доступа к чужому ресурсу или недостаточно прав.

**Решение:**

1. Проверьте, что ресурс принадлежит текущему пользователю
2. Для admin-only эндпоинтов используйте admin@example.com

### Ошибка 404 Not Found

**Причина:** Ресурс не найден или неверный ID.

**Решение:**

1. Проверьте корректность ID в URL
2. Убедитесь, что ресурс существует в базе данных

### База данных заблокирована

**Причина:** Другой процесс использует файл базы данных.

**Решение:**

1. Остановите запущенный сервер
2. Закройте все соединения с БД
3. Повторите операцию

---

## 10. Контакты для поддержки

При возникновении проблем:

1. Проверьте логи сервера в терминале
2. Убедитесь, что сервер запущен: `curl http://localhost:3000`
3. Проверьте подключение к базе данных: `sqlite3 backend/database.sqlite "SELECT 1"`
