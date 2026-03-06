# Frontend Developer Plan: OpenCode как основной генератор кода

## Цель документа

Пошаговый план настройки **любого** фронтенд-репозитория (React, Redux, RTK Query, MUI, Webpack, Module Federation, Jest, Playwright) для работы с OpenCode-агентом, чтобы при постановке задачи агент:

1. Декомпозировал задачу
2. Написал тесты (TDD: Red)
3. Реализовал код (TDD: Green)
4. Провел рефакторинг (TDD: Refactor)
5. Запустил все тесты повторно
6. Верифицировал результат

---

## Часть 1: Инфраструктура репозитория

### 1.1 Структура `.opencode/` в корне проекта

Создай в корне FE-репозитория директорию `.opencode/` со следующей структурой:

```
.opencode/
├── AGENTS.md              # Главный регламент (система инструкций)
├── package.json           # Зависимости OpenCode плагинов
├── opencode.json          # Конфигурация агентов и провайдеров
├── agents/                # Кастомные агенты (см. 2.2)
├── skills/                # Навыки (инструкции для LLM)
│   ├── react-dev/
│   │   └── SKILL.md
│   ├── redux-dev/
│   │   └── SKILL.md
│   ├── tdd-workflow/
│   │   └── SKILL.md
│   ├── component-testing/
│   │   └── SKILL.md
│   ├── e2e-testing/
│   │   └── SKILL.md
│   └── mui-theming/
│       └── SKILL.md
├── tools/                 # Кастомные инструменты
│   └── contextDocs.ts     # Инструмент подтягивания документации
├── plugins/               # Плагины
└── features/              # Хранилище задач
    └── frontend/
        ├── feat_1/
        ├── feat_2/
        └── ...
```

### 1.2 documents_hub — централизованный источник знаний

Создай отдельный репозиторий `documents_hub` (или используй существующий) со структурой:

```
documents_hub/
├── frontend/
│   ├── FE_APP_SETTINGS.md    # Главный файл: стек, архитектура, ссылки
│   ├── REACT.md              # Правила React: hooks, patterns, FC
│   ├── REDUX.md              # Redux Toolkit + RTK Query правила
│   ├── TYPESCRIPT.md         # TypeScript strict mode, типизация
│   ├── TESTING.md            # Jest + RTL + Playwright правила
│   ├── MUI.md                # MUI: темизация, sx, styled API
│   ├── WEBPACK.md            # Webpack 5 + Module Federation
│   ├── FSD.md                # Feature-Sliced Design
│   └── ROUTING.md            # React Router 6
├── testing/
│   └── TESTING_RULES.md      # TDD: Red-Green-Refactor цикл
└── opencode/
    ├── agents.md              # Как работают агенты
    ├── skills.md              # Как работают skills
    ├── tools.md               # Как работают tools
    ├── subagents.md           # Как работают subagents
    └── architecture.md        # Архитектура OpenCode
```

**Зачем:** Агент перед каждой задачей подтягивает актуальные правила из documents_hub через tool `contextDocs`. Это гарантирует, что код генерируется по вашим стандартам, а не по "общим знаниям" LLM.

---

## Часть 2: Настройка агентов

### 2.1 AGENTS.md — главный регламент

Файл `.opencode/AGENTS.md` определяет поведение агента. Вот шаблон для FE-проекта:

```markdown
# AGENTS.md — Регламент Frontend-разработки

## Технологический стек
- React 18+, TypeScript 5+ (strict: true)
- Redux Toolkit + RTK Query
- MUI (Material UI) — UI-kit
- Webpack 5 + Module Federation
- Jest + React Testing Library (unit)
- Playwright (e2e)

## Архитектура
- Feature-Sliced Design (FSD)
- Слои: app > pages > widgets > features > entities > shared

## Стиль кода
- 2 пробела, одинарные кавычки, точки с запятой обязательны
- JSDoc для публичных методов
- Naming: PascalCase для компонентов, camelCase для функций/переменных

## Процесс работы с контекстом
- Перед задачей ОБЯЗАТЕЛЬНО вызывать `contextDocs` для получения правил
- documents_hub — единственный источник правды по стандартам кода

## Процесс работы с задачами
[Используй алгоритм из секции 3 данного плана]
```

### 2.2 Кастомные агенты — специализация

Настрой в `opencode.json` минимум 4 агента:

#### 1) frontend-builder (основной рабочий)
```json
{
  "id": "frontend-builder",
  "name": "Frontend Builder",
  "mode": "build",
  "permissions": {
    "read": "allow",
    "edit": "allow",
    "bash": "allow",
    "task": "allow"
  },
  "prompt": "Ты — senior frontend-разработчик. Работаешь по TDD. Перед началом работы загружаешь контекст из contextDocs. Пишешь тесты ДО реализации. Следуешь FSD архитектуре. Используешь MUI для UI, RTK Query для API. Все компоненты — функциональные с hooks."
}
```

#### 2) frontend-planner (планирование и ревью)
```json
{
  "id": "frontend-planner",
  "name": "Frontend Planner",
  "mode": "plan",
  "permissions": {
    "read": "allow",
    "edit": "deny",
    "bash": "ask",
    "task": "deny"
  },
  "prompt": "Ты — архитектор фронтенда. Анализируешь задачу, декомпозируешь на sub-tasks, оцениваешь сложность. НЕ пишешь код. Задаёшь уточняющие вопросы. Предлагаешь структуру файлов и тестов."
}
```

#### 3) tester (тестирование)
```json
{
  "id": "frontend-tester",
  "name": "Frontend Tester",
  "mode": "build",
  "permissions": {
    "read": "allow",
    "edit": "allow",
    "bash": "allow",
    "task": "deny"
  },
  "prompt": "Ты — QA-инженер фронтенда. Пишешь unit-тесты (Jest + RTL) и e2e-тесты (Playwright). Следуешь AAA-паттерну. Используешь семантичные queries (getByRole, getByLabelText). Проверяешь edge cases. Запускаешь тесты и проверяешь результат."
}
```

#### 4) code-reviewer (ревью после реализации)
```json
{
  "id": "frontend-reviewer",
  "name": "Frontend Reviewer",
  "mode": "plan",
  "permissions": {
    "read": "allow",
    "edit": "deny",
    "bash": "allow",
    "task": "deny"
  },
  "prompt": "Ты — code reviewer фронтенда. Проверяешь: соответствие FSD, правильность типизации, покрытие тестами, отсутствие code smells, правильное использование MUI/Redux/RTK Query. Формируешь отчёт с конкретными замечаниями и строками кода."
}
```

---

## Часть 3: Алгоритм выполнения задач (TDD Pipeline)

### 3.1 Полный цикл задачи

```
Постановка задачи
      │
      ▼
┌─────────────────────────┐
│ ШАГ 1: ПЛАНИРОВАНИЕ    │  Агент: frontend-planner
│ - contextDocs           │
│ - Декомпозиция          │
│ - Создание feat_N/      │
│ - Уточняющие вопросы    │
└─────────┬───────────────┘
          │ Подтверждение пользователя
          ▼
┌─────────────────────────┐
│ ШАГ 2: RED (тесты)     │  Агент: frontend-builder
│ - Написать unit-тесты   │
│ - Написать e2e-тесты    │
│ - Запустить — ВСЕ ПАДАЮТ│
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ ШАГ 3: GREEN (код)     │  Агент: frontend-builder
│ - Минимальная реализация│
│ - Запустить тесты       │
│ - ВСЕ ПРОХОДЯТ         │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ ШАГ 4: REFACTOR        │  Агент: frontend-builder
│ - Улучшить код          │
│ - Тесты остаются зелёными│
│ - Max 3 итерации        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ ШАГ 5: РЕВЬЮ           │  Агент: frontend-reviewer
│ - Проверка соответствия │
│   плану                 │
│ - Проверка стандартов    │
│ - Отчёт с замечаниями   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ ШАГ 6: ФИНАЛИЗАЦИЯ     │  Агент: frontend-builder
│ - Исправление замечаний │
│ - Финальный прогон тестов│
│ - Обновление STATUS.md  │
└─────────────────────────┘
```

### 3.2 Структура задач в `.opencode/features/frontend/`

```
.opencode/features/frontend/
└── feat_N/
    ├── feature_N.md       # Описание, контекст, декомпозиция, зависимости
    ├── sub_task_1.md       # Атомарная задача 1 + тесткейсы для TDD
    ├── sub_task_2.md       # Атомарная задача 2 + тесткейсы для TDD
    ├── sub_task_3.md       # (до 5 sub-tasks)
    └── STATUS.md           # Статус: to do → in progress → done
```

### 3.3 Шаблон feature_N.md

```markdown
# Feature N: [Название]

## Описание
[Что нужно сделать]

## Контекст (из contextDocs)
- Архитектура: [результат contextDocs layer=frontend]
- Связанные стандарты: [результат contextDocs topic=REACT/REDUX/MUI]

## Декомпозиция
1. sub_task_1: [описание]
2. sub_task_2: [описание]
3. sub_task_3: [описание]

## Оценка сложности
- Время: [часы]
- Риски: [список]

## Зависимости
- Модули: [какие модули затрагиваются]
- API: [какие endpoint-ы используются]
```

### 3.4 Шаблон sub_task_N.md

```markdown
# Sub Task N: [Название]

## Описание
[Подробное описание атомарной задачи]

## Способ решения
[Как решать, какие паттерны использовать — из contextDocs]

## Подготовка тесткейсов для TDD (ОБЯЗАТЕЛЬНО)

### Unit-тесты (Jest + RTL)
- [ ] Test 1: [describe > it: описание]
- [ ] Test 2: [describe > it: описание]
- [ ] Test 3: [edge case]

### E2E-тесты (Playwright) — если применимо
- [ ] Test 1: [user flow описание]

## Ожидаемый результат
[Что должно работать после выполнения]

## Критерии приёмки
- [ ] Все unit-тесты проходят
- [ ] E2E тесты проходят (если есть)
- [ ] TypeScript компилируется без ошибок
- [ ] Нет ESLint warnings
- [ ] JSDoc на публичных методах
```

---

## Часть 4: Skills — инструкции для агента

### 4.1 react-dev/SKILL.md

```markdown
# React Development

## Когда использовать
При создании/модификации React-компонентов.

## Правила
1. Только функциональные компоненты (FC)
2. Props через TypeScript interfaces (не type)
3. Деструктуризация props в параметрах
4. Мемоизация: React.memo для компонентов, useMemo/useCallback для вычислений
5. Кастомные хуки выносить в отдельные файлы `use*.ts`
6. Ленивая загрузка через React.lazy + Suspense

## Структура компонента (FSD)
features/
  feature-name/
    ui/
      ComponentName.tsx        # Компонент
      ComponentName.styles.ts  # Стили (styled/sx)
    model/
      slice.ts                 # Redux slice
      selectors.ts             # Selectors
      types.ts                 # Типы
    api/
      api.ts                   # RTK Query endpoints
    __tests__/
      ComponentName.test.tsx   # Тесты
      use-hook.test.ts         # Тесты хуков

## Пример компонента
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export const UserCard: FC<UserCardProps> = ({ user, onEdit }) => {
  const handleEdit = useCallback(() => {
    onEdit(user.id);
  }, [user.id, onEdit]);

  return (
    <Card>
      <CardContent>
        <Typography>{user.name}</Typography>
      </CardContent>
      <CardActions>
        <Button onClick={handleEdit}>Edit</Button>
      </CardActions>
    </Card>
  );
};
```

### 4.2 redux-dev/SKILL.md

```markdown
# Redux Toolkit + RTK Query

## Когда использовать
При работе с глобальным состоянием и серверными данными.

## RTK Query — для серверных данных
- Каждый API-домен — отдельный createApi
- baseQuery с обработкой ошибок и refresh token
- Теги для инвалидации кэша
- Трансформация ответов в transformResponse

## Redux Slice — для клиентского состояния
- Один slice на domain entity
- Используй createSlice с PayloadAction
- Selectors через createSelector (memoized)
- Никогда не мутируй state напрямую (Immer делает это за тебя)

## Пример RTK Query
export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    updateUser: builder.mutation<User, UpdateUserDto>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

## Тестирование RTK Query
- Мокаем fetchBaseQuery или используем MSW
- Проверяем кэширование и инвалидацию
- Тестируем loading/error/success состояния в компонентах
```

### 4.3 tdd-workflow/SKILL.md

```markdown
# TDD Workflow

## Когда использовать
Всегда при добавлении новой функциональности.

## Цикл Red -> Green -> Refactor

### 1. Red — Напиши тест
- Тест описывает ожидаемое поведение
- Тест компилируется, но ПАДАЕТ при запуске
- Один тест = одна концепция

### 2. Green — Минимальный код
- Пиши минимум кода для прохождения теста
- Не стремись к идеалу — стремись к работающему коду
- Hardcoded значения допустимы на этом этапе

### 3. Refactor — Улучши
- Убери дублирование, улучши имена
- Тесты ДОЛЖНЫ оставаться зелёными
- Max 3 итерации рефакторинга

## Команды запуска
npm test -- --testPathPattern=файл.test   # один файл
npm test                                   # все unit-тесты
npx playwright test                        # все e2e-тесты
npx playwright test файл.spec.ts           # один e2e-тест

## Лимиты
- Не более 5 итераций цикла Red-Green-Refactor на одну sub-task
- Если за 5 итераций не получается — пересмотри декомпозицию
```

### 4.4 component-testing/SKILL.md

```markdown
# Component Testing (Jest + React Testing Library)

## Когда использовать
При тестировании React-компонентов, хуков, утилит.

## Структура теста (AAA)
describe('ComponentName', () => {
  it('should do something', () => {
    // Arrange — подготовка
    // Act — действие
    // Assert — проверка
  });
});

## Queries — порядок приоритета
1. getByRole('button', { name: /submit/i })    // Лучше всего
2. getByLabelText('Email')                      // Для форм
3. getByPlaceholderText('Enter email')          // Для инпутов
4. getByText('Hello')                           // Для текста
5. getByTestId('submit-btn')                    // Крайний случай

## Обязательные тесты для компонента
- Рендер с дефолтными props
- Рендер с кастомными props
- Обработка events (click, change, submit)
- Loading state
- Error state
- Disabled state (если есть)
- Edge cases (пустые данные, длинные строки)

## Тестирование с Redux
import { renderWithProviders } from '@/test-utils';

renderWithProviders(<Component />, {
  preloadedState: { ... }
});

## Тестирование хуков
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useMyHook());
act(() => { result.current.doSomething(); });
expect(result.current.value).toBe(expected);

## Моки
jest.mock('@/api', () => ({
  useGetUsersQuery: jest.fn().mockReturnValue({
    data: mockUsers,
    isLoading: false,
    error: null,
  }),
}));
```

### 4.5 e2e-testing/SKILL.md

```markdown
# E2E Testing (Playwright)

## Когда использовать
Для проверки полноценных пользовательских сценариев.

## Что тестируем
- Полный flow страницы (логин, CRUD, навигация)
- Критические бизнес-процессы
- Интеграцию frontend + backend API

## Что НЕ тестируем в E2E
- Отдельные UI компоненты (unit тесты)
- Валидацию отдельных полей (unit тесты)
- Граничные случаи (unit тесты)

## Структура e2e/
e2e/
├── auth/
│   ├── login.spec.ts
│   └── registration.spec.ts
├── dashboard/
│   └── dashboard.spec.ts
└── fixtures/
    └── test-data.ts

## Пример
test.describe('Login', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});

## Команды
npx playwright test                    # все тесты
npx playwright test --headed           # с браузером
npx playwright test --ui               # интерактивный UI
npx playwright show-report             # отчет
```

### 4.6 mui-theming/SKILL.md

```markdown
# MUI (Material UI)

## Когда использовать
При работе с UI-компонентами и темизацией.

## Правила
1. Используй MUI-компоненты вместо HTML-тегов
2. Стилизация через sx prop (приоритет) или styled API
3. Темизация через ThemeProvider + createTheme
4. Не используй inline styles
5. Брейкпоинты через theme.breakpoints

## sx prop (приоритет)
<Box sx={{
  display: 'flex',
  gap: 2,
  p: { xs: 1, md: 3 },
  bgcolor: 'background.paper',
}}>

## styled API
const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

## Тема
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});
```

---

## Часть 5: Кастомные инструменты (Tools)

### 5.1 contextDocs — подтягивание документации

Инструмент `contextDocs` уже реализован (см. `.opencode/tools/contextDocs.ts`). Его задача — загружать правила из `documents_hub` (локально или с GitHub).

**Ключевые вызовы для FE-задач:**

| Цель | Вызов |
|------|-------|
| Общий стек FE | `contextDocs({ layer: "frontend" })` |
| Правила React | `contextDocs({ layer: "frontend", topic: "REACT" })` |
| Правила Redux | `contextDocs({ layer: "frontend", topic: "REDUX" })` |
| Правила MUI | `contextDocs({ layer: "frontend", topic: "MUI" })` |
| Правила Webpack | `contextDocs({ layer: "frontend", topic: "WEBPACK" })` |
| Правила тестирования | `contextDocs({ layer: "frontend", topic: "TESTING" })` |
| FSD архитектура | `contextDocs({ layer: "frontend", topic: "FSD" })` |
| TypeScript | `contextDocs({ layer: "frontend", topic: "TYPESCRIPT" })` |
| Поиск по ключевому слову | `contextDocs({ layer: "frontend", search: "rtk query" })` |
| Список разделов | `contextDocs({ layer: "frontend", listSections: true })` |

### 5.2 Дополнительные инструменты (рекомендация)

Рассмотри создание дополнительных tools:

#### runTests — запуск тестов с парсингом результата
```typescript
// .opencode/tools/runTests.ts
export default tool({
  description: 'Run Jest or Playwright tests and parse results',
  args: {
    type: z.enum(['unit', 'e2e']),
    path: z.string().optional(), // конкретный файл
    watch: z.boolean().optional(),
  },
  async execute({ type, path, watch }) {
    // unit: npm test -- --json --testPathPattern=path
    // e2e: npx playwright test path --reporter=json
    // Парсинг JSON-output, возврат структурированного результата
  },
});
```

#### checkTypes — проверка TypeScript
```typescript
// .opencode/tools/checkTypes.ts
export default tool({
  description: 'Run TypeScript compiler to check types',
  args: {},
  async execute() {
    // npx tsc --noEmit --pretty
    // Парсинг ошибок, возврат списка проблем
  },
});
```

#### lintCheck — проверка ESLint
```typescript
// .opencode/tools/lintCheck.ts
export default tool({
  description: 'Run ESLint and return issues',
  args: {
    path: z.string().optional(),
    fix: z.boolean().optional(),
  },
  async execute({ path, fix }) {
    // npx eslint path --format=json (--fix)
    // Возврат структурированного списка проблем
  },
});
```

---

## Часть 6: Subagents — параллельное выполнение

### 6.1 Когда использовать subagents

Для FE-задач subagents полезны при:

1. **Параллельном анализе** — один subagent анализирует компоненты, другой — state management
2. **Разделение ответственности** — один пишет тесты, другой реализацию
3. **Code review** — отдельный subagent в plan mode проверяет результат

### 6.2 Пример использования

```
Задача: "Добавить страницу профиля пользователя"

Parent Agent (frontend-builder):
├─ Subagent 1 (plan): "Проанализируй существующие страницы, определи паттерн"
├─ Subagent 2 (plan): "Проверь API endpoint-ы для профиля пользователя"
│
│  ... Parent создаёт план на основе результатов ...
│
├─ Subagent 3 (build): "Создай RTK Query endpoint-ы для профиля"
├─ Subagent 4 (build): "Создай компоненты страницы профиля"
│
│  ... Parent запускает тесты ...
│
└─ Subagent 5 (plan): "Проведи code review реализации"
```

---

## Часть 7: Чеклист подготовки репозитория

### 7.1 Обязательные файлы и конфигурации

- [ ] `.opencode/AGENTS.md` — регламент с процессом задач и TDD
- [ ] `.opencode/opencode.json` — конфигурация агентов (4 агента из 2.2)
- [ ] `.opencode/package.json` — зависимость `@opencode-ai/plugin`
- [ ] `.opencode/skills/` — минимум 6 skills (react, redux, tdd, component-testing, e2e, mui)
- [ ] `.opencode/tools/contextDocs.ts` — инструмент подтягивания документации
- [ ] `.opencode/features/frontend/` — директория для хранения задач
- [ ] `documents_hub/frontend/` — 8 файлов документации (FE_APP_SETTINGS, REACT, REDUX, TYPESCRIPT, TESTING, MUI, WEBPACK, FSD)
- [ ] `documents_hub/testing/TESTING_RULES.md` — TDD правила

### 7.2 Конфигурация тестирования в проекте

- [ ] `jest.config.js` — настроен с `@testing-library/jest-dom`, coverage thresholds
- [ ] `playwright.config.ts` — настроен с baseURL, projects (chromium, firefox)
- [ ] `src/test-utils.tsx` — `renderWithProviders` (Provider + ThemeProvider + Router)
- [ ] `.env.test` — переменные окружения для тестов
- [ ] `package.json` scripts:
  - `"test"` — запуск Jest
  - `"test:watch"` — Jest в watch mode
  - `"test:cov"` — Jest с coverage
  - `"test:e2e"` — запуск Playwright
  - `"type-check"` — `tsc --noEmit`
  - `"lint"` — ESLint

### 7.3 Верификация работоспособности

Перед началом работы с агентом, убедись:

1. **`npm test` работает** — Jest запускается и проходит (или нет тестов)
2. **`npx playwright test` работает** — Playwright установлен и настроен
3. **`npx tsc --noEmit` работает** — TypeScript компилирует без ошибок
4. **`npx eslint src/` работает** — ESLint настроен
5. **`contextDocs` отвечает** — documents_hub доступен (локально или GitHub)

---

## Часть 8: Примеры постановки задач агенту

### 8.1 Новая фича (полный цикл)

```
Новая задача: Создать компонент UserProfileCard, который отображает 
аватар, имя и email пользователя. Компонент должен использовать MUI Card, 
получать данные через RTK Query endpoint GET /api/users/:id. 
При клике на "Edit" открывать модальное окно редактирования.
```

Агент должен:
1. Вызвать `contextDocs` для REACT, REDUX, MUI, TESTING
2. Создать `feat_N/` с декомпозицией
3. Запросить подтверждение
4. Выполнить TDD цикл для каждого sub_task
5. Провести self-review
6. Обновить STATUS.md

### 8.2 Баг-фикс

```
Новая задача: Исправить баг — при обновлении профиля пользователя 
данные не обновляются в UI без перезагрузки страницы. 
Проблема в компоненте src/features/user/ui/UserProfile.tsx
```

Агент должен:
1. Прочитать код проблемного компонента
2. Написать тест, воспроизводящий баг (Red)
3. Исправить (Green)
4. Убедиться что все тесты проходят

### 8.3 Рефакторинг

```
Новая задача: Перевести компонент Dashboard с прямых fetch-запросов 
на RTK Query. Текущий код в src/pages/dashboard/ui/Dashboard.tsx 
использует useEffect + fetch. Нужно создать API slice и заменить.
```

---

## Часть 9: Антипаттерны — чего НЕ делать

1. **НЕ начинать код без плана** — всегда сначала `feat_N/` с декомпозицией
2. **НЕ пропускать TDD** — тесты ДО реализации, всегда
3. **НЕ игнорировать contextDocs** — без загрузки правил агент генерирует "generic" код
4. **НЕ создавать больше 5 sub-tasks** — если задача больше, разбей на несколько feat
5. **НЕ запускать реализацию без подтверждения** — пользователь проверяет план
6. **НЕ пропускать ревью** — всегда проверяй соответствие плану после реализации
7. **НЕ менять sub-tasks в процессе** — если нужны изменения, создай новую задачу
8. **НЕ хранить rules в голове** — всё в documents_hub и skills

---

## Часть 10: Рекомендации по эволюции системы

### 10.1 Метрики для отслеживания

- Процент задач, завершённых с первого прогона TDD (без дополнительных итераций)
- Количество замечаний на code review
- Покрытие тестами (coverage %)
- Время на sub-task

### 10.2 Развитие skills

По мере накопления опыта добавляй новые skills:
- `accessibility/SKILL.md` — правила a11y
- `performance/SKILL.md` — оптимизация рендера, bundle size
- `module-federation/SKILL.md` — правила MF-приложений
- `error-handling/SKILL.md` — обработка ошибок, error boundaries
- `forms/SKILL.md` — работа с формами (react-hook-form / formik)

### 10.3 Развитие tools

- `bundleAnalyzer` — анализ размера бандла
- `storybook` — генерация stories для компонентов
- `migrationHelper` — помощь при обновлении зависимостей

### 10.4 Развитие documents_hub

Добавляй документы по мере роста проекта:
- `PERFORMANCE.md` — гайд по оптимизации
- `ACCESSIBILITY.md` — a11y стандарты
- `MODULE_FEDERATION.md` — правила shared/remote модулей
- `CI_CD.md` — pipeline правила
- `CODE_REVIEW_CHECKLIST.md` — чеклист для ревью
