# Создание Tools в OpenCode: 4 подхода на примере Crypto Price

## Содержание

1. [Сравнение подходов](#сравнение-подходов)
2. [Подход 1: Bash (Ad-hoc)](#подход-1-bash-ad-hoc)
3. [Подход 2: Auto-generation через промпт](#подход-2-auto-generation-через-промпт)
4. [Подход 3: MCP Server](#подход-3-mcp-server)
5. [Подход 4: Custom Code](#подход-4-custom-code)
6. [Decision Tree: Какой выбрать?](#decision-tree-какой-выбрать)
7. [Чеклист реализации](#чеклист-реализации)

---

## Сравнение подходов

| Подход | Сложность | Требует кода | Время настройки | Повторное использование | Лучше всего для |
|--------|-----------|--------------|-----------------|------------------------|-----------------|
| **1. Bash (Ad-hoc)** | ⭐ Легко | ❌ Нет | 1 минута | ❌ Нет | Разовые запросы, быстрые проверки |
| **2. Auto-generation** | ⭐⭐ Средне | ⚙️ Генерируется | 2-3 минуты | ✅ Да | Частое использование, стандартные API |
| **3. MCP Server** | ⭐⭐ Средне | ❌ Нет (конфиг) | 5 минут | ✅ Да | Интеграция с существующими сервисами |
| **4. Custom Code** | ⭐⭐⭐ Сложно | ✅ Да | 10-15 минут | ✅ Да | Сложная логика, кэширование, обработка ошибок |

---

## Подход 1: Bash (Ad-hoc)

**Когда использовать:** Разовые запросы, быстрая проверка цены, отладка.

### Принцип работы

Используем встроенный `bash` tool для прямого вызова API через curl и обработки через jq.

### Пример 1: Простой запрос цены

```bash
# Запрос к пользователю
"Get the current ATOM price using bash"

# OpenCode выполняет:
bash curl -s "https://api.coingecko.com/api/v3/simple/price?ids=cosmos&vs_currencies=usd" | jq -r '.cosmos.usd'

# Результат: 4.23
```

### Пример 2: С форматированием

```bash
# Запрос
"Get detailed ATOM info with 24h change using bash and jq"

# OpenCode выполняет:
bash curl -s "https://api.coingecko.com/api/v3/simple/price?ids=cosmos&vs_currencies=usd&include_24hr_change=true" | jq -r '"ATOM: $\(.cosmos.usd)\n24h Change: \(.cosmos.usd_24h_change)%"'

# Результат:
# ATOM: $4.23
# 24h Change: 5.23%
```

### Пример 3: Несколько токенов

```bash
# Запрос
"Get prices for ATOM, MOVE, and BTC using bash"

# OpenCode выполняет:
bash curl -s "https://api.coingecko.com/api/v3/simple/price?ids=cosmos,movement,bitcoin&vs_currencies=usd" | jq -r 'to_entries | .[] | "\(.key): $\(.value.usd)"'

# Результат:
# cosmos: $4.23
# movement: $0.85
# bitcoin: $45231.00
```

### Преимущества

- ✅ Мгновенно, без настройки
- ✅ Не требует создания файлов
- ✅ Работает прямо в конверсации

### Недостатки

- ❌ Не сохраняется между сессиями
- ❌ Нет кэширования
- ❌ Сложная обработка ошибок
- ❌ Нет переиспользования

### Промпты для Bash подхода

```markdown
Простая цена:
"Get ATOM price using bash and curl"

Детальная информация:
"Get ATOM price with 24h change, market cap, and volume using bash, curl and jq"

Сравнение токенов:
"Compare prices of ATOM, MOVE, and BTC using bash with formatted output"

С обработкой ошибок:
"Get ATOM price using bash with error handling if API fails"
```

---

## Подход 2: Auto-generation через промпт

**Когда использовать:** Нужен переиспользуемый tool, но не хочется писать код вручную.

### Принцип работы

OpenCode сам генерирует код tool на TypeScript на основе вашего описания и сохраняет его в `.opencode/tools/`.

### Пример: Создание crypto_price tool

#### Шаг 1: Промпт для генерации

```markdown
Создай tool для получения цен криптовалют через CoinGecko API. 
Требования:
- Поддержка ATOM, MOVE, BTC, ETH, SOL
- Получение текущей цены в USD
- Опционально: market cap, 24h volume, 24h change
- Кэширование на 60 секунд
- Обработка ошибок API

Сохрани в .opencode/tools/cryptoPrice.ts
```

#### Шаг 2: OpenCode генерирует код

```typescript
// .opencode/tools/cryptoPrice.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

interface CoinGeckoResponse {
  [key: string]: {
    usd: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  };
}

const COIN_ID_MAP: Record<string, string> = {
  ATOM: "cosmos",
  MOVE: "movement",
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
};

const cache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 60000;

export default tool({
  description: "Get cryptocurrency prices from CoinGecko API with caching",
  args: {
    symbol: z.string().describe("Cryptocurrency symbol (ATOM, MOVE, BTC, ETH, SOL)"),
    includeDetails: z.boolean().optional().default(false),
  },
  async execute(args, context) {
    const normalizedSymbol = args.symbol.toUpperCase();
    const coinId = COIN_ID_MAP[normalizedSymbol];
    
    if (!coinId) {
      throw new Error(`Unsupported symbol: ${normalizedSymbol}`);
    }
    
    const cacheKey = `${normalizedSymbol}-${args.includeDetails}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    
    try {
      const params = new URLSearchParams({
        ids: coinId,
        vs_currencies: "usd",
        include_market_cap: String(args.includeDetails),
        include_24hr_vol: String(args.includeDetails),
        include_24hr_change: String(args.includeDetails),
      });
      
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: CoinGeckoResponse = await response.json();
      const coin = data[coinId];
      
      let result = `${normalizedSymbol}: $${coin.usd}`;
      
      if (args.includeDetails) {
        result += `\nMarket Cap: $${(coin.usd_market_cap! / 1e9).toFixed(2)}B`;
        result += `\n24h Volume: $${(coin.usd_24h_vol! / 1e6).toFixed(2)}M`;
        result += `\n24h Change: ${coin.usd_24h_change! >= 0 ? "+" : ""}${coin.usd_24h_change!.toFixed(2)}%`;
      }
      
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch ${normalizedSymbol} price: ${error}`);
    }
  },
});
```

#### Шаг 3: Использование

```markdown
"Get ATOM price"
[crypto_price: {"symbol": "ATOM"}]

"Get detailed MOVE info"
[crypto_price: {"symbol": "MOVE", "includeDetails": true}]
```

### Продвинутые промпты для генерации

```markdown
Базовый tool:
"Create a tool to fetch cryptocurrency prices from CoinGecko API"

С деталями:
"Generate a crypto price tool that supports ATOM, MOVE, BTC with optional market cap and 24h change"

С кэшированием:
"Create a crypto price tool with 1-minute caching and proper error handling"

С валидацией:
"Generate a tool to get crypto prices with strict input validation and rate limiting"

Мульти-токен:
"Create a tool that can fetch prices for multiple tokens in one call"
```

### Преимущества

- ✅ Не нужно писать код самому
- ✅ Сохраняется между сессиями
- ✅ Можно редактировать сгенерированный код
- ✅ Быстрая настройка (2-3 минуты)

### Недостатки

- ⚠️ Требует проверки сгенерированного кода
- ⚠️ Может потребовать доработки
- ⚠️ Не всегда оптимально

---

## Подход 3: MCP Server

**Когда использовать:** Хотите использовать готовое решение без написания кода.

### Вариант 3.1: mcp-crypto-price (CoinCap API)

#### Шаг 1: Конфигурация opencode.json

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "crypto-price": {
      "type": "local",
      "command": ["npx", "-y", "mcp-crypto-price"],
      "enabled": true
    }
  }
}
```

#### Шаг 2: Промпт для подключения

```markdown
"Connect mcp-crypto-price server to get cryptocurrency prices"

Или полный промпт:
"Add MCP server for crypto prices using npx mcp-crypto-price"
```

#### Шаг 3: Использование

```markdown
"Get current Bitcoin price using crypto-price MCP"
"Analyze ATOM market trends with crypto-price server"
"Get historical data for MOVE using MCP"
```

### Вариант 3.2: coinmarketcap-mcp

Для полной интеграции с CoinMarketCap API (требует API key):

```json
{
  "mcp": {
    "coinmarketcap": {
      "type": "local",
      "command": ["npx", "-y", "coinmarketcap-mcp"],
      "environment": {
        "COINMARKETCAP_API_KEY": "${CMC_API_KEY}"
      },
      "enabled": true
    }
  }
}
```

### Вариант 3.3: Generic HTTP/Fetch MCP

Если нужен простой HTTP client:

```json
{
  "mcp": {
    "fetch": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-fetch"],
      "enabled": true
    }
  }
}
```

Использование:
```markdown
"Fetch https://api.coingecko.com/api/v3/simple/price?ids=cosmos&vs_currencies=usd using MCP fetch"
```

### Доступные MCP серверы для крипто

| Сервер | API | Особенности | Установка |
|--------|-----|-------------|-----------|
| **mcp-crypto-price** | CoinCap | Real-time prices, market analysis | `npx -y mcp-crypto-price` |
| **coinmarketcap-mcp** | CoinMarketCap | 50+ endpoints, полные данные | `npx -y coinmarketcap-mcp` |
| **coin_api_mcp** | CoinMarketCap | Listings, quotes, metadata | `npx -y coin_api_mcp` |
| **fetch** | Generic | Любые HTTP запросы | `npx -y @modelcontextprotocol/server-fetch` |

### Преимущества

- ✅ Не нужно писать код вообще
- ✅ Профессиональная реализация
- ✅ Регулярные обновления
- ✅ Сообщество поддержки

### Недостатки

- ❌ Зависимость от внешнего сервера
- ❌ Может требовать API keys
- ❌ Ограниченная кастомизация
- ❌ Добавляет зависимости проекту

### Промпты для MCP подхода

```markdown
Базовое подключение:
"Add mcp-crypto-price server to opencode.json"

С API ключом:
"Configure coinmarketcap-mcp with my API key"

Проверка статуса:
"Check if crypto-price MCP server is connected"

Использование:
"Get ATOM price using crypto-price MCP server"
"Analyze market trends for MOVE with MCP"
```

---

## Подход 4: Custom Code

**Когда использовать:** Нужна максимальная гибкость, сложная логика, интеграция с проектом.

### Полная реализация

```typescript
// .opencode/tools/cryptoPrice.ts
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

// ===== ТИПЫ =====
interface CoinGeckoResponse {
  [coinId: string]: {
    usd: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  };
}

interface CacheEntry {
  data: string;
  timestamp: number;
  expiresAt: number;
}

// ===== КОНФИГУРАЦИЯ =====
const COIN_ID_MAP: Record<string, string> = {
  ATOM: "cosmos",
  MOVE: "movement",
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  AVAX: "avalanche-2",
  DOT: "polkadot",
  LINK: "chainlink",
  MATIC: "matic-network",
  ADA: "cardano",
};

const DEFAULT_CACHE_TTL = 60000; // 1 минута
const REQUEST_TIMEOUT = 5000;    // 5 секунд

// ===== КЭШ =====
const priceCache = new Map<string, CacheEntry>();

function getCached(key: string): string | null {
  const entry = priceCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  priceCache.delete(key);
  return null;
}

function setCached(key: string, data: string, ttl: number): void {
  priceCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  });
}

// ===== HTTP КЛИЕНТ =====
async function fetchWithTimeout(
  url: string, 
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ===== TOOL =====
export default tool({
  id: "crypto_price",
  description: `
    Get cryptocurrency prices from CoinGecko API with advanced features:
    - Real-time and cached prices
    - Market data (cap, volume, change)
    - Multiple currencies
    - Error handling and retries
    
    Supported: ATOM, MOVE, BTC, ETH, SOL, AVAX, DOT, LINK, MATIC, ADA
  `,
  
  args: {
    symbol: z.string()
      .min(1)
      .max(10)
      .transform((s) => s.toUpperCase())
      .describe("Cryptocurrency symbol (e.g., 'ATOM', 'MOVE')"),
    
    includeDetails: z.boolean()
      .optional()
      .default(false)
      .describe("Include market cap, volume, and 24h change"),
    
    vsCurrency: z.enum(["usd", "eur", "btc", "eth"])
      .optional()
      .default("usd")
      .describe("Price currency"),
    
    forceRefresh: z.boolean()
      .optional()
      .default(false)
      .describe("Bypass cache and fetch fresh data"),
    
    cacheDuration: z.number()
      .min(0)
      .max(300000)
      .optional()
      .default(DEFAULT_CACHE_TTL)
      .describe("Cache duration in ms (0 to disable)"),
  },
  
  async execute(args, context) {
    const startTime = Date.now();
    const { symbol, includeDetails, vsCurrency, forceRefresh, cacheDuration } = args;
    
    // Валидация символа
    const coinId = COIN_ID_MAP[symbol];
    if (!coinId) {
      throw new Error(
        `Unsupported cryptocurrency: ${symbol}. ` +
        `Supported: ${Object.keys(COIN_ID_MAP).join(", ")}`
      );
    }
    
    // Проверка кэша
    const cacheKey = `${symbol}-${vsCurrency}-${includeDetails}`;
    
    if (!forceRefresh && cacheDuration > 0) {
      const cached = getCached(cacheKey);
      if (cached) {
        context.metadata({
          source: "cache",
          duration: Date.now() - startTime,
          symbol,
        });
        return `${cached}\n\n[Cached]`;
      }
    }
    
    // Запрос к API
    try {
      const params = new URLSearchParams({
        ids: coinId,
        vs_currencies: vsCurrency,
        ...(includeDetails && {
          include_market_cap: "true",
          include_24hr_vol: "true",
          include_24hr_change: "true",
          include_last_updated_at: "true",
        }),
      });
      
      const url = `https://api.coingecko.com/api/v3/simple/price?${params}`;
      
      context.metadata({
        step: "fetching",
        url: url.replace(/\/\/[^/]+/, "//[API]"),
      });
      
      const response = await fetchWithTimeout(url, REQUEST_TIMEOUT);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a minute.");
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: CoinGeckoResponse = await response.json();
      const coinData = data[coinId];
      
      if (!coinData) {
        throw new Error(`No data returned for ${symbol}`);
      }
      
      // Форматирование результата
      const price = coinData[vsCurrency];
      const currencySymbol = vsCurrency === "usd" ? "$" : vsCurrency.toUpperCase();
      
      let result = `💰 ${symbol} Price\n`;
      result += `━━━━━━━━━━━━━━━━━\n`;
      result += `${currencySymbol}${price.toLocaleString()}\n`;
      
      if (includeDetails) {
        const change = coinData[`${vsCurrency}_24h_change`];
        const changeEmoji = change && change >= 0 ? "🟢" : "🔴";
        
        result += `\n📊 Market Data:\n`;
        result += `Market Cap: ${currencySymbol}${(coinData[`${vsCurrency}_market_cap`]! / 1e9).toFixed(2)}B\n`;
        result += `24h Volume: ${currencySymbol}${(coinData[`${vsCurrency}_24h_vol`]! / 1e6).toFixed(2)}M\n`;
        result += `24h Change: ${changeEmoji} ${change ? (change >= 0 ? "+" : "") + change.toFixed(2) : "N/A"}%\n`;
        
        if (coinData.last_updated_at) {
          result += `\n🕐 Updated: ${new Date(coinData.last_updated_at * 1000).toLocaleString()}`;
        }
      }
      
      // Сохранение в кэш
      if (cacheDuration > 0) {
        setCached(cacheKey, result.replace("\n\n[Cached]", ""), cacheDuration);
      }
      
      // Метаданные
      context.metadata({
        source: "api",
        duration: Date.now() - startTime,
        symbol,
        price,
        currency: vsCurrency,
        cached: false,
      });
      
      return result;
      
    } catch (error) {
      context.metadata({
        error: true,
        errorType: error instanceof Error ? error.name : "Unknown",
        duration: Date.now() - startTime,
      });
      
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
        }
        throw new Error(`Failed to fetch ${symbol} price: ${error.message}`);
      }
      
      throw new Error(`Unknown error fetching ${symbol} price`);
    }
  },
});
```

### Конфигурация permissions

```json
// opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "crypto_price": "allow",
    "read": "allow",
    "bash": "ask"
  }
}
```

### Использование

```markdown
"Get ATOM price"
[crypto_price: {"symbol": "ATOM"}]

"Get detailed MOVE info"
[crypto_price: {"symbol": "MOVE", "includeDetails": true}]

"Get BTC price in EUR"
[crypto_price: {"symbol": "BTC", "vsCurrency": "eur"}]

"Force fresh data"
[crypto_price: {"symbol": "SOL", "forceRefresh": true}]

"Custom cache duration (5 min)"
[crypto_price: {"symbol": "ETH", "cacheDuration": 300000}]
```

### Продвинутые возможности Custom Code

```typescript
// Мульти-токен запрос
export const batchCryptoPrice = tool({
  description: "Get prices for multiple cryptocurrencies at once",
  args: {
    symbols: z.array(z.string()).min(1).max(10),
    includeDetails: z.boolean().optional(),
  },
  async execute(args) {
    const ids = args.symbols.map((s) => COIN_ID_MAP[s.toUpperCase()]).filter(Boolean);
    // ... batch request logic
  },
});

// История цен
export const cryptoHistory = tool({
  description: "Get historical price data",
  args: {
    symbol: z.string(),
    days: z.number().min(1).max(365),
  },
  async execute(args) {
    // ... historical data logic
  },
});
```

### Преимущества

- ✅ Полный контроль над логикой
- ✅ Максимальная производительность
- ✅ Кастомная обработка ошибок
- ✅ Интеграция с проектом
- ✅ Расширяемость

### Недостатки

- ❌ Требует знаний TypeScript
- ❌ Больше времени на разработку
- ❌ Нужно поддерживать код

---

## Decision Tree: Какой выбрать?

```
Нужно получить цену крипто?
│
├─> Только один раз / быстрая проверка?
│   └─> Используй [BASH APPROACH]
│       "Get ATOM price using bash and curl"
│
├─> Буду использовать часто?
│   │
│   ├─> Не хочу писать код?
│   │   ├─> Есть готовый MCP сервер?
│   │   │   └─> Используй [MCP APPROACH]
│   │   │       "Add mcp-crypto-price server"
│   │   │
│   │   └─> Нет подходящего MCP?
│   │       └─> Используй [AUTO-GENERATION APPROACH]
│   │           "Create crypto price tool for me"
│   │
│   └─> Готов писать код / нужна кастомизация?
│       └─> Используй [CUSTOM CODE APPROACH]
│           Ручное создание .opencode/tools/cryptoPrice.ts
│
└─> Нужна интеграция с проектом / сложная логика?
    └─> Используй [CUSTOM CODE APPROACH]
        Полная реализация с кэшированием и обработкой ошибок
```

### Быстрый выбор

| Сценарий | Рекомендуемый подход | Время |
|----------|---------------------|-------|
| "Сколько стоит ATOM прямо сейчас?" | Bash | 10 сек |
| "Буду проверять цены каждый день" | Auto-generation | 2 мин |
| "Нужны профессиональные данные" | MCP (coinmarketcap) | 5 мин |
| "Встроить в моё приложение" | Custom Code | 15 мин |

---

## Чеклист реализации

### Bash подход ✅

- [ ] Запросить цену через промпт
- [ ] OpenCode использует bash + curl + jq
- [ ] Получить результат мгновенно

**Пример промпта:**
```
Get ATOM price using bash and CoinGecko API
```

### Auto-generation подход ✅

- [ ] Описать требования в промпте
- [ ] Дать команду создать tool
- [ ] Проверить сгенерированный код
- [ ] Протестировать tool
- [ ] При необходимости отредактировать

**Пример промпта:**
```
Create a cryptocurrency price tool that:
- Fetches prices from CoinGecko API
- Supports ATOM, MOVE, BTC, ETH
- Has 60-second caching
- Includes error handling

Save it to .opencode/tools/cryptoPrice.ts
```

### MCP подход ✅

- [ ] Найти подходящий MCP сервер
- [ ] Добавить конфигурацию в opencode.json
- [ ] Перезапустить OpenCode
- [ ] Проверить подключение
- [ ] Использовать MCP tools

**Конфигурация:**
```json
{
  "mcp": {
    "crypto-price": {
      "type": "local",
      "command": ["npx", "-y", "mcp-crypto-price"]
    }
  }
}
```

### Custom Code подход ✅

- [ ] Создать файл `.opencode/tools/cryptoPrice.ts`
- [ ] Написать полную реализацию
- [ ] Добавить типы и валидацию
- [ ] Реализовать кэширование
- [ ] Добавить обработку ошибок
- [ ] Настроить permissions
- [ ] Протестировать

**Структура файла:**
```typescript
import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

// Types
// Configuration
// Cache
// Helper functions
// Tool definition
export default tool({
  // implementation
});
```

---

## Заключение

OpenCode предоставляет гибкую систему создания tools от полностью no-code (bash, MCP) до полного контроля (custom code).

**Для криптовалютных цен рекомендуется:**

1. **Быстрая проверка** → Bash
2. **Регулярное использование** → Auto-generation или MCP
3. **Продакшн** → Custom Code

**Ключевые инсайты:**

- Bash подходит для 80% разовых задач
- Auto-generation экономит время на типовых интеграциях
- MCP даёт доступ к профессиональным API
- Custom Code незаменим для сложной бизнес-логики

Все подходы можно комбинировать в рамках одного проекта!
