/**
 * ============================================================================
 * contextDocs — тул для получения документации из documents_hub
 * ============================================================================
 *
 * Назначение:
 *   Предоставляет агентам доступ к централизованному репозиторию конвенций,
 *   гайдлайнов и архитектурных правил (documents_hub). Каждый агент мультиагентной
 *   системы ОБЯЗАН загружать релевантные конвенции перед началом работы.
 *
 * Источники данных (в порядке приоритета):
 *   1. Локальная копия по пути из переменной DOCUMENTS_HUB_PATH
 *      — сначала из process.env, затем из .env файла в корне проекта
 *   2. Локальная копия по дефолтному пути ../documents_hub (относительно корня проекта)
 *   3. GitHub raw content (fallback):
 *      https://raw.githubusercontent.com/HisokaWizard/documents_hub/main
 *
 * Структура documents_hub:
 *   documents_hub/
 *   ├── backend/                # Backend конвенции (NestJS)
 *   │   ├── BE_APP_SETTINGS.md  # Главный файл слоя — точка входа
 *   │   ├── NEST_JS_ARCHITECTURE.md
 *   │   ├── DATABASE.md
 *   │   ├── MIGRATIONS.md
 *   │   ├── BACKEND_TESTING.md
 *   │   └── nestjs/             # Вложенная папка с детальными гайдами
 *   │       ├── MODULE.md
 *   │       ├── CONTROLLER.md
 *   │       ├── SERVICE.md
 *   │       ├── DEPENDENCY_INJECTION.md
 *   │       ├── REPOSITORY.md
 *   │       ├── ENTITY.md
 *   │       ├── PIPE.md
 *   │       ├── GUARD.md
 *   │       ├── EXCEPTION_FILTER.md
 *   │       ├── INTERCEPTOR.md
 *   │       └── LIFECYCLE_HOOKS.md
 *   ├── frontend/               # Frontend конвенции (React/TypeScript)
 *   │   ├── FE_APP_SETTINGS.md  # Главный файл слоя — точка входа
 *   │   ├── REACT.md
 *   │   ├── TYPESCRIPT.md
 *   │   ├── REDUX.md
 *   │   ├── ROUTING.md
 *   │   ├── MUI.md
 *   │   ├── WEBPACK.md
 *   │   ├── TESTING.md
 *   │   └── FSD.md
 *   └── testing/                # Общие правила тестирования
 *
 * API (параметры вызова):
 *
 *   layer (обязательный): "backend" | "frontend"
 *     Слой приложения, для которого запрашивается документация.
 *
 *   topic (опциональный): string
 *     Имя топика для загрузки. Регистр не важен — приводится к UPPER_CASE.
 *     Тул ищет файл {TOPIC}.md сначала в корне слоя, затем во вложенных папках.
 *     Примеры: "CONTROLLER", "REACT", "FSD", "NEST_JS_ARCHITECTURE"
 *
 *   section (опциональный): string
 *     Конкретная секция (заголовок ## или #) внутри топика.
 *     Используется вместе с topic для получения части документа.
 *
 *   search (опциональный): string
 *     Поисковый запрос (регулярное выражение). Ищет по всем .md файлам слоя
 *     рекурсивно, включая вложенные директории.
 *
 *   refresh (опциональный): boolean (default: false)
 *     Принудительно обновить данные, игнорируя кэш (TTL кэша — 24 часа).
 *
 *   listSections (опциональный): boolean (default: false)
 *     Вернуть список всех доступных файлов/секций слоя вместо контента.
 *
 * Примеры вызовов:
 *
 *   // Список всех секций backend
 *   contextDocs({ layer: "backend", listSections: true })
 *
 *   // Архитектура NestJS
 *   contextDocs({ layer: "backend", topic: "NEST_JS_ARCHITECTURE" })
 *
 *   // Конвенции контроллеров (файл лежит в backend/nestjs/CONTROLLER.md)
 *   contextDocs({ layer: "backend", topic: "CONTROLLER" })
 *
 *   // Секция "TDD Подход" из документа по тестированию
 *   contextDocs({ layer: "backend", topic: "BACKEND_TESTING", section: "TDD Подход" })
 *
 *   // FSD-архитектура фронтенда
 *   contextDocs({ layer: "frontend", topic: "FSD" })
 *
 *   // Поиск по ключевому слову
 *   contextDocs({ layer: "backend", search: "repository pattern" })
 *
 *   // Принудительное обновление кэша
 *   contextDocs({ layer: "frontend", topic: "REACT", refresh: true })
 *
 * Чтение переменных окружения:
 *   Тул читает DOCUMENTS_HUB_PATH из двух источников:
 *   1. process.env.DOCUMENTS_HUB_PATH — если переменная задана в системном окружении
 *   2. .env файл в корне проекта (context.directory или process.cwd()) —
 *      парсится вручную без внешних зависимостей (dotenv не требуется)
 *
 *   Если переменная не найдена ни в одном источнике, используется дефолтный путь
 *   ../documents_hub относительно корня проекта.
 *
 * Кэширование:
 *   Загруженные документы кэшируются в памяти на 24 часа.
 *   Для принудительного обновления передайте refresh: true.
 *
 * ============================================================================
 */

import { tool, type ToolContext } from '@opencode-ai/plugin';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import axios from 'axios';

// ---------------------------------------------------------------------------
// Типы
// ---------------------------------------------------------------------------

/** Запись в кэше документа */
interface CacheEntry {
  content: string;
  timestamp: number;
  source: 'local' | 'github';
}

// ---------------------------------------------------------------------------
// Константы
// ---------------------------------------------------------------------------

/** Кэш загруженных документов (ключ — относительный путь файла) */
const CACHE = new Map<string, CacheEntry>();

/** Время жизни записи в кэше — 24 часа */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/** Базовый URL для fallback-загрузки с GitHub */
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/HisokaWizard/documents_hub/main';

/** Имя .env файла в корне проекта */
const ENV_FILE_NAME = '.env';

/** Имя переменной окружения с путём к documents_hub */
const HUB_PATH_ENV_KEY = 'DOCUMENTS_HUB_PATH';

/** Дефолтное имя папки documents_hub (относительно корня проекта) */
const DEFAULT_HUB_DIR = 'documents_hub';

// ---------------------------------------------------------------------------
// Чтение переменных окружения из .env
// ---------------------------------------------------------------------------

/**
 * Парсит .env файл и возвращает объект с переменными.
 *
 * Формат парсинга:
 *   - Пропускает пустые строки и комментарии (начинающиеся с #)
 *   - Поддерживает формат KEY=VALUE и KEY="VALUE" и KEY='VALUE'
 *   - Снимает обрамляющие кавычки (одинарные и двойные)
 *
 * @param filePath — абсолютный путь к .env файлу
 * @returns объект с парами ключ-значение
 */
async function parseEnvFile(filePath: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Пропускаем пустые строки и комментарии
      if (!line || line.startsWith('#')) {
        continue;
      }

      // Ищем первый знак '=' — всё до него ключ, всё после — значение
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) {
        continue;
      }

      const key = line.substring(0, eqIndex).trim();
      let value = line.substring(eqIndex + 1).trim();

      // Снимаем обрамляющие кавычки
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key) {
        result[key] = value;
      }
    }
  } catch {
    // Файл не найден или нечитаем — возвращаем пустой объект
  }

  return result;
}

/**
 * Определяет базовый путь к documents_hub.
 *
 * Приоритет:
 *   1. process.env.DOCUMENTS_HUB_PATH — системная переменная окружения
 *   2. .env файл в корне проекта (projectRoot) — парсится вручную
 *   3. ../documents_hub — дефолтный путь (на уровень выше от корня проекта)
 *
 * @param projectRoot — корневая директория проекта (из context.directory)
 * @returns абсолютный путь к documents_hub
 */
async function resolveHubPath(projectRoot: string): Promise<string> {
  // 1. Системная переменная окружения
  if (process.env[HUB_PATH_ENV_KEY]) {
    return process.env[HUB_PATH_ENV_KEY];
  }

  // 2. Читаем из .env файла в корне проекта
  const envFilePath = path.resolve(projectRoot, ENV_FILE_NAME);
  const envVars = await parseEnvFile(envFilePath);

  if (envVars[HUB_PATH_ENV_KEY]) {
    return envVars[HUB_PATH_ENV_KEY];
  }

  // 3. Дефолтный путь — ../documents_hub от корня проекта
  return path.resolve(projectRoot, '..', DEFAULT_HUB_DIR);
}

// ---------------------------------------------------------------------------
// Работа с файловой системой
// ---------------------------------------------------------------------------

/**
 * Проверяет существование файла по относительному пути внутри documents_hub.
 *
 * @param hubBasePath — абсолютный путь к корню documents_hub
 * @param relativePath — путь относительно корня хаба (например "backend/CONTROLLER.md")
 */
async function checkLocalPath(hubBasePath: string, relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.resolve(hubBasePath, relativePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Читает файл из локальной копии documents_hub.
 *
 * @param hubBasePath — абсолютный путь к корню documents_hub
 * @param relativePath — путь относительно корня хаба
 */
async function readLocalFile(hubBasePath: string, relativePath: string): Promise<string> {
  const fullPath = path.resolve(hubBasePath, relativePath);
  return String(await fs.readFile(fullPath, 'utf-8'));
}

/**
 * Загружает файл с GitHub (fallback-источник) через axios.
 *
 * Используется, когда локальная копия documents_hub недоступна.
 * URL формируется как: GITHUB_RAW_BASE/{relativePath}
 *
 * @param relativePath — путь относительно корня хаба
 */
async function fetchFromGitHub(relativePath: string): Promise<string> {
  const url = `${GITHUB_RAW_BASE}/${relativePath}`;
  const response = await axios.get<string>(url, {
    responseType: 'text',
    timeout: 15_000,
  });

  return String(response.data);
}

// ---------------------------------------------------------------------------
// Кэширование и загрузка документов
// ---------------------------------------------------------------------------

/**
 * Загружает документ по относительному пути с кэшированием.
 *
 * Логика:
 *   1. Проверяет кэш (если не forceRefresh и запись не устарела — возвращает из кэша)
 *   2. Пробует прочитать из локальной копии
 *   3. При неудаче — загружает с GitHub
 *   4. Сохраняет результат в кэш
 *
 * @param hubBasePath — абсолютный путь к корню documents_hub
 * @param relativePath — путь файла относительно корня хаба
 * @param forceRefresh — игнорировать кэш
 */
async function getDocument(
  hubBasePath: string,
  relativePath: string,
  forceRefresh: boolean = false
): Promise<{ content: string; source: 'local' | 'github' }> {
  const cacheKey = relativePath;

  // Проверяем кэш
  if (!forceRefresh) {
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { content: String(cached.content), source: cached.source };
    }
  }

  // Пробуем локальную копию
  const hasLocal = await checkLocalPath(hubBasePath, relativePath);
  if (hasLocal) {
    const content = await readLocalFile(hubBasePath, relativePath);
    CACHE.set(cacheKey, { content, timestamp: Date.now(), source: 'local' });
    return { content, source: 'local' };
  }

  // Fallback — GitHub
  const content = await fetchFromGitHub(relativePath);
  CACHE.set(cacheKey, { content, timestamp: Date.now(), source: 'github' });
  return { content, source: 'github' };
}

// ---------------------------------------------------------------------------
// Работа со структурой документации
// ---------------------------------------------------------------------------

/**
 * Парсит markdown-ссылки из содержимого главного файла слоя.
 * Извлекает относительные пути к .md файлам (исключая http-ссылки и якоря).
 *
 * @param content — содержимое главного файла (BE_APP_SETTINGS.md или FE_APP_SETTINGS.md)
 * @returns массив относительных путей к файлам документации
 */
function parseSections(content: string): string[] {
  const sectionRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const sections: string[] = [];
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const [, , link] = match;
    if (!link.startsWith('http') && !link.startsWith('#') && link.endsWith('.md')) {
      sections.push(link.replace(/^\.\//, ''));
    }
  }

  return sections;
}

/**
 * Рекурсивно собирает все .md файлы из указанной директории.
 *
 * Обходит вложенные папки (например backend/nestjs/) и возвращает
 * относительные пути от корня директории.
 *
 * @param dirPath — абсолютный путь к директории для сканирования
 * @param prefix — текущий префикс пути (для рекурсии)
 * @returns массив относительных путей к .md файлам
 */
async function collectMdFiles(dirPath: string, prefix: string = ''): Promise<string[]> {
  const results: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        const nested = await collectMdFiles(path.join(dirPath, entry.name), relativeName);
        results.push(...nested);
      } else if (entry.name.endsWith('.md')) {
        results.push(relativeName);
      }
    }
  } catch {
    // Директория не существует или недоступна
  }

  return results;
}

/**
 * Разрешает имя топика в путь к файлу внутри слоя.
 *
 * Алгоритм поиска:
 *   1. Прямое совпадение: {layer}/{TOPIC}.md (например backend/DATABASE.md)
 *   2. Поиск во вложенных директориях по имени файла
 *      (например topic="CONTROLLER" → backend/nestjs/CONTROLLER.md)
 *
 * Имя топика приводится к UPPER_CASE перед поиском.
 *
 * @param hubBasePath — абсолютный путь к корню documents_hub
 * @param layer — слой ("backend" или "frontend")
 * @param topicName — имя топика (регистр не важен)
 * @returns относительный путь к файлу или null если не найден
 */
async function resolveTopicPath(
  hubBasePath: string,
  layer: string,
  topicName: string
): Promise<string | null> {
  const layerPath = path.resolve(hubBasePath, layer);
  const normalizedTopic = topicName.toUpperCase();

  // 1. Прямое совпадение в корне слоя
  const directPath = `${layer}/${normalizedTopic}.md`;
  if (await checkLocalPath(hubBasePath, directPath)) {
    return directPath;
  }

  // 2. Поиск во вложенных директориях
  const allFiles = await collectMdFiles(layerPath);
  for (const file of allFiles) {
    const fileName = path.basename(file, '.md').toUpperCase();
    if (fileName === normalizedTopic) {
      return `${layer}/${file}`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Основные операции
// ---------------------------------------------------------------------------

/**
 * Получает содержимое топика по имени.
 *
 * Сначала пробует найти файл в локальной копии (resolveTopicPath),
 * затем пробует fallback-пути на GitHub (корень слоя и nestjs/).
 *
 * @param hubBasePath — абсолютный путь к корню documents_hub
 * @param layer — слой ("backend" или "frontend")
 * @param sectionName — имя топика
 * @param forceRefresh — игнорировать кэш
 */
async function getSectionContent(
  hubBasePath: string,
  layer: string,
  sectionName: string,
  forceRefresh: boolean
): Promise<string> {
  // Пробуем найти через локальную файловую систему
  const resolvedPath = await resolveTopicPath(hubBasePath, layer, sectionName);

  if (resolvedPath) {
    try {
      const { content } = await getDocument(hubBasePath, resolvedPath, forceRefresh);
      return content;
    } catch {
      // Переходим к fallback
    }
  }

  // Fallback: пробуем типичные пути на GitHub
  const possiblePaths = [
    `${layer}/${sectionName.toUpperCase()}.md`,
    `${layer}/nestjs/${sectionName.toUpperCase()}.md`,
  ];

  for (const tryPath of possiblePaths) {
    try {
      const { content } = await getDocument(hubBasePath, tryPath, forceRefresh);
      return content;
    } catch {
      continue;
    }
  }

  return `Секция "${sectionName}" не найдена в ${layer}`;
}

/**
 * Ищет текст по всем .md файлам слоя (рекурсивно).
 *
 * Для каждого файла с совпадениями возвращает до 3 фрагментов контекста
 * (по 50 символов до и после совпадения).
 *
 * @param hubBasePath — абсолютный путь к корню documents_hub
 * @param layer — слой ("backend" или "frontend")
 * @param searchTerm — поисковый запрос (регулярное выражение)
 * @param forceRefresh — игнорировать кэш
 */
async function searchInAllFiles(
  hubBasePath: string,
  layer: string,
  searchTerm: string,
  forceRefresh: boolean
): Promise<Array<{ file: string; matches: string[] }>> {
  const results: Array<{ file: string; matches: string[] }> = [];
  const layerPath = path.resolve(hubBasePath, layer);

  // Рекурсивно собираем все .md файлы
  const allFiles = await collectMdFiles(layerPath);

  for (const file of allFiles) {
    const filePath = `${layer}/${file}`;
    try {
      const { content } = await getDocument(hubBasePath, filePath, forceRefresh);
      const searchRegex = new RegExp(searchTerm, 'gi');
      const matches: string[] = [];
      let match;

      while ((match = searchRegex.exec(content)) !== null) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + searchTerm.length + 50);
        matches.push(content.substring(start, end).trim());
      }

      if (matches.length > 0) {
        results.push({ file: file.replace('.md', ''), matches });
      }
    } catch {
      // Пропускаем файлы, которые не удалось прочитать
    }
  }

  return results;
}

/**
 * Возвращает список всех доступных .md файлов слоя.
 *
 * Сначала пробует рекурсивный обход файловой системы.
 * Если локальная копия недоступна — парсит ссылки из главного файла слоя.
 *
 * @param hubBasePath — абсолютный путь к корню documents_hub
 * @param layer — слой ("backend" или "frontend")
 * @param mainContent — содержимое главного файла (для fallback-парсинга)
 */
async function listAllSections(
  hubBasePath: string,
  layer: string,
  mainContent: string
): Promise<string[]> {
  const layerPath = path.resolve(hubBasePath, layer);

  // Пробуем собрать реальный список файлов
  try {
    const allFiles = await collectMdFiles(layerPath);
    if (allFiles.length > 0) {
      return allFiles;
    }
  } catch {
    // Переходим к парсингу ссылок
  }

  // Fallback: парсим ссылки из главного файла
  return parseSections(mainContent);
}

// ---------------------------------------------------------------------------
// Экспорт тула
// ---------------------------------------------------------------------------

export default tool({
  description:
    'Получение документации из documents_hub для контекста разработки. ' +
    'Загружает архитектурные гайдлайны, описание стека, правила и best practices ' +
    'из локальной копии или GitHub (fallback). Поддерживает поиск по имени топика и по содержимому.',

  args: {
    layer: z.enum(['frontend', 'backend'])
      .describe('Слой приложения: "backend" (NestJS) или "frontend" (React/FSD)'),

    topic: z.string().optional()
      .describe(
        'Имя топика для загрузки (регистр не важен). ' +
        'Примеры: "NEST_JS_ARCHITECTURE", "CONTROLLER", "REACT", "FSD", "BACKEND_TESTING"'
      ),

    section: z.string().optional()
      .describe(
        'Конкретная секция (заголовок) внутри топика. ' +
        'Используется вместе с topic. Пример: topic="BACKEND_TESTING", section="TDD Подход"'
      ),

    search: z.string().optional()
      .describe(
        'Поисковый запрос (regex). Ищет по всем .md файлам слоя рекурсивно. ' +
        'Пример: "repository pattern", "useEffect"'
      ),

    refresh: z.boolean().optional().default(false)
      .describe('Принудительно обновить данные, игнорируя кэш (TTL кэша — 24 часа)'),

    listSections: z.boolean().optional().default(false)
      .describe('Вернуть список всех доступных файлов/секций слоя вместо контента'),
  },

  async execute(args, context: ToolContext) {
    const { layer, topic, section, search, refresh, listSections } = args;

    // Определяем корень проекта из контекста тула
    const projectRoot = context.directory || process.cwd();

    // Определяем путь к documents_hub с учётом .env
    const hubBasePath = await resolveHubPath(projectRoot);

    // --- Режим поиска ---
    if (search) {
      const searchResults = await searchInAllFiles(hubBasePath, layer, search, refresh);

      if (searchResults.length === 0) {
        return `Ничего не найдено по запросу "${search}" в документации ${layer}.`;
      }

      const formattedResults = searchResults.map(result =>
        `## ${result.file}\n${result.matches.slice(0, 3).map(m => `- ...${m}...`).join('\n')}`
      ).join('\n\n');

      return `Результаты поиска "${search}" в ${layer}:\n\n${formattedResults}`;
    }

    // --- Определяем главный файл слоя ---
    const mainFile = layer === 'frontend'
      ? 'frontend/FE_APP_SETTINGS.md'
      : 'backend/BE_APP_SETTINGS.md';

    try {
      const { content: mainContent } = await getDocument(hubBasePath, mainFile, refresh);

      // --- Режим: список секций ---
      if (listSections) {
        const sections = await listAllSections(hubBasePath, layer, mainContent);
        return `Доступные секции в ${layer}:\n${sections.map(s => `- ${s}`).join('\n')}`;
      }

      // --- Режим: загрузка топика ---
      if (topic) {
        const topicContent = await getSectionContent(hubBasePath, layer, topic, refresh);

        // Если запрошена конкретная секция внутри топика
        if (section) {
          const sectionRegex = new RegExp(`##?\\s*${section}[^#]*`, 'i');
          const match = topicContent.match(sectionRegex);

          if (match) {
            return match[0].trim();
          }

          return `Секция "${section}" не найдена в ${layer}/${topic}`;
        }

        return topicContent;
      }

      // --- Режим по умолчанию: главный файл + список секций ---
      const sections = await listAllSections(hubBasePath, layer, mainContent);
      return `${mainContent}\n\n---\nДоступные секции:\n${sections.map(s => `- ${s}`).join('\n')}`;

    } catch (error) {
      throw new Error(
        `Не удалось получить документацию для ${layer}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      );
    }
  }
});
