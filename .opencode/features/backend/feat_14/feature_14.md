# Feature 14: Repository Pattern (Custom Repositories)

## Описание

Создать кастомные классы репозиториев для всех сущностей проекта, расширяющие `Repository<Entity>` из TypeORM. Перенести всю логику работы с БД из сервисов в репозитории, обеспечив соответствие архитектурной конвенции: `Controller -> Service -> Repository -> Entity`.

## Контекст

### Проблема

Все сервисы проекта инжектят `Repository<Entity>` из TypeORM напрямую через `@InjectRepository()`. Кастомных репозиториев не существует. Это нарушает конвенцию из documents_hub: "One repository per entity" и "No business logic in repository — только CRUD и запросы".

Текущее состояние — логика запросов к БД (find, findOne, createQueryBuilder, save, update, delete) размазана по сервисам, что:
- Затрудняет тестирование (нужно мокать TypeORM Repository напрямую)
- Нарушает Separation of Concerns
- Делает невозможным переиспользование запросов между сервисами

### Затронутые модули и сущности

| Модуль | Сущность | Сервисы, использующие `@InjectRepository()` |
|--------|----------|---------------------------------------------|
| auth | User | AuthService |
| assets | Asset (CryptoAsset, NFTAsset) | AssetsService, AssetUpdateService |
| assets | HistoricalPrice | AssetUpdateService |
| notifications | NotificationSettings | AlertsService, NotificationsService, NotificationService |
| notifications | NotificationLog | AlertsService, ReportsService, NotificationsService, NotificationService |
| notifications | ReportLog | ReportsService |
| notifications | Asset (read-only) | AlertsService, ReportsService, NotificationService |
| notifications | User (read-only) | NotificationService, AssetUpdateService |
| user-settings | UserSettings | UserSettingsService |

### Архитектурные решения

1. **Паттерн репозитория** — по конвенции из documents_hub (REPOSITORY.md):
   ```typescript
   @Injectable()
   export class UsersRepository {
     constructor(@InjectRepository(User) private repository: Repository<User>) {}
   }
   ```

2. **Один репозиторий на сущность** — 7 кастомных репозиториев:
   - `UserRepository` (auth)
   - `AssetRepository` (assets)
   - `HistoricalPriceRepository` (assets)
   - `NotificationSettingsRepository` (notifications)
   - `NotificationLogRepository` (notifications)
   - `ReportLogRepository` (notifications)
   - `UserSettingsRepository` (user-settings)

3. **Сервисы инжектят кастомные репозитории** вместо `Repository<Entity>`.

4. **Репозитории содержат только CRUD и запросы** — никакой бизнес-логики.

## Декомпозиция

| # | Sub-task | Описание | Зависимости |
|---|----------|----------|-------------|
| 1 | Репозитории модуля auth | UserRepository + рефакторинг AuthService | - |
| 2 | Репозитории модуля assets | AssetRepository, HistoricalPriceRepository + рефакторинг AssetsService, AssetUpdateService | - |
| 3 | Репозитории модуля notifications | NotificationSettingsRepository, NotificationLogRepository, ReportLogRepository + рефакторинг AlertsService, ReportsService, NotificationsService, NotificationService | - |
| 4 | Репозиторий модуля user-settings | UserSettingsRepository + рефакторинг UserSettingsService | - |
| 5 | Интеграция и регрессия | Обновление модулей, проверка cross-module зависимостей, регрессионные тесты | 1, 2, 3, 4 |

## Оценка сложности

- **Общая:** Высокая (Large)
- **Sub-task 1:** Средняя (4 метода в AuthService)
- **Sub-task 2:** Высокая (самый большой модуль, 2 репозитория, 2 сервиса, сложные QueryBuilder запросы)
- **Sub-task 3:** Высокая (3 репозитория, 4 сервиса, QueryBuilder запросы)
- **Sub-task 4:** Средняя (1 репозиторий, 1 сервис)
- **Sub-task 5:** Средняя (интеграция модулей, регрессия)

## Риски

1. **Высокий:** Рефакторинг AssetUpdateService — самый сложный сервис с множеством `@InjectRepository()` (4 штуки) и сложной логикой. Нужно аккуратно выделить запросы, не сломав бизнес-логику.
2. **Средний:** Cross-module зависимости — NotificationService и AssetUpdateService инжектят репозитории из чужих модулей (Asset, User). После рефакторинга нужно корректно экспортировать кастомные репозитории.
3. **Средний:** Существующие тесты — все `.spec.ts` файлы мокают `Repository<Entity>`. После рефакторинга нужно обновить моки на кастомные репозитории.
4. **Низкий:** Наследование Asset (TableInheritance) — CryptoAsset и NFTAsset наследуют от Asset. Репозиторий должен корректно работать с обоими типами.

## Порядок выполнения

```
sub_task_1 (auth)  ─────────┐
sub_task_2 (assets) ────────┤
sub_task_3 (notifications) ─┼──> sub_task_5 (интеграция)
sub_task_4 (user-settings) ─┘
```

Sub-tasks 1-4 **независимы** друг от друга и могут выполняться параллельно.
Sub-task 5 зависит от завершения всех предыдущих.
