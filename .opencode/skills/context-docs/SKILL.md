# Context Docs Tool

Получение документации из documents_hub для контекста разработки.

## Когда использовать

- Перед началом разработки новой фичи
- Нужно понять архитектуру проекта
- Требуется уточнить стандарты кодирования
- Необходимо найти информацию по ключевому слову
- Нужно получить информацию о стеке технологий

## Как работает

Иерархия поиска документации:
1. **Локальная копия** — проверяется путь `../documents_hub/`
2. **GitHub** — если локальной нет, скачивается с raw.githubusercontent.com
3. **Кэш** — результат кэшируется на 24 часа

## Использование

### Базовое: получить главный файл

```
Получи документацию по бэкенду
→ [context_docs: {"layer": "backend"}]
→ Возвращает BE_APP_SETTINGS.md со списком разделов
```

### Получить конкретный топик

```
Как настроить базу данных?
→ [context_docs: {"layer": "backend", "topic": "DATABASE"}]
→ Возвращает backend/DATABASE.md
```

**Важно:** Имена файлов в documents_hub пишутся **КАПСОМ** (WEBPACK.md, не webpack.md)

### Поиск по содержимому всех файлов

```
Найди информацию о webpack во фронтенде
→ [context_docs: {"layer": "frontend", "search": "webpack"}]
→ Ищет "webpack" во всех .md файлах фронтенда
→ Возвращает совпадения с контекстом
```

### Список доступных разделов

```
Какие разделы есть во фронтенде?
→ [context_docs: {"layer": "frontend", "listSections": true}]
→ Список: REACT, REDUX, MUI, ROUTING...
```

### Обновление кэша

```
Обнови документацию по бэкенду
→ [context_docs: {"layer": "backend", "refresh": true}]
→ Принудительно скачивает свежую версию
```

## Параметры

- **layer** (обязательный): `frontend` или `backend`
- **topic** (опциональный): конкретная тема (**КАПСОМ**: "NESTJS", "REACT", "WEBPACK")
- **section** (опциональный): подраздел внутри темы
- **search** (опциональный): поисковый запрос для поиска по всем файлам
- **refresh** (опциональный): принудительно обновить (по умолчанию: false)
- **listSections** (опциональный): вернуть список разделов (по умолчанию: false)

## Структура documents_hub

```
documents_hub/
├── frontend/
│   ├── FE_APP_SETTINGS.md      # Главный файл
│   ├── REACT.md
│   ├── REDUX.md
│   ├── MUI.md
│   ├── WEBPACK.md
│   └── ROUTING.md
└── backend/
    ├── BE_APP_SETTINGS.md      # Главный файл
│   ├── NESTJS/
│   │   ├── NEST_JS_ARCHITECTURE.md
│   │   ├── MODULE.md
│   │   └── ...
    ├── DATABASE.md
    ├── AUTHENTICATION.md
    └── TESTING.md
```

## Примеры использования

**Архитектура фронтенда:**
```
Покажи архитектуру фронтенда
→ [context_docs: {"layer": "frontend"}]
```

**Настройка Webpack (по имени файла):**
```
Как настроить webpack?
→ [context_docs: {"layer": "frontend", "topic": "WEBPACK"}]
```

**Поиск webpack (по содержимому):**
```
Где упоминается webpack?
→ [context_docs: {"layer": "frontend", "search": "webpack"}]
→ Найдёт в WEBPACK.md, REACT.md, и других файлах
```

**NestJS структура:**
```
Как организован бэкенд на NestJS?
→ [context_docs: {"layer": "backend", "topic": "NEST_JS_ARCHITECTURE"}]
```

## Источник данных

Приоритет:
1. `../documents_hub/` — локальная копия
2. `https://raw.githubusercontent.com/HisokaWizard/documents_hub/main/` — GitHub

Ручное обновление локальной копии:
```bash
cd ../documents_hub && git pull
```
