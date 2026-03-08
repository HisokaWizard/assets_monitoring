# Model Fallback — Автоматическое переключение модели AI

> **name:** model-fallback
> **description:** Автоматическое переключение модели AI при недоступности. Используй, когда: модель не отвечает, возникают ошибки API, таймауты, проблемы с подключением к антропику. Автоматически переключается на fallback-модель (minimax).

---

## Когда применять

Используй этот навык, когда:

- Получаешь ошибки API (timeout, 429, 500, 503)
- Модель не отвечает или возвращает пустой ответ
- Видишь сообщения о недоступности anthropic/claude-opus-4-6
- Пользователь сообщает о проблемах с моделью
- Возникают ошибки аутентификации с API ключами

---

## Процесс переключения

### 1. Определи проблему

Типичные ошибки при недоступности opus 4.6:

```
- APIError: Model not found
- APIError: Rate limit exceeded
- APIError: Service unavailable
- Connection timeout
- Authentication error
```

### 2. Выполни переключение

Используй тул `modelSwitcher` для переключения на fallback-модель:

```typescript
modelSwitcher({
  targetModel: 'minimax',
  fallback: true,
  updateAgents: true,
});
```

Это автоматически:

- Обновит `model` в opencode.json на `opencode/minimax-m2.5-free`
- Обновит `small_model` на `opencode/minimax-m2.5-free`
- Обновит `model` для всех агентов в секции `agent.*`
- Сообщит о выполненных изменениях

### 3. Уведоми пользователя

После переключения сообщи:

```
⚠️ **Модель переключена на fallback (minimax)**

Причина: [описание ошибки]
Модель: opencode/minimax-m2.5-free

Для возврата на opus 4.6 используй:
modelSwitcher({ targetModel: "opus" })
```

---

## Доступные модели

| Ключ      | Модель                     | Описание                    |
| --------- | -------------------------- | --------------------------- |
| `opus`    | anthropic/claude-opus-4-6  | Основная модель (приоритет) |
| `minimax` | opencode/minimax-m2.5-free | Fallback модель             |

---

## Примеры использования

### Автоматический fallback при ошибке

```typescript
// При ошибке API вызови:
modelSwitcher({
  targetModel: 'minimax',
  fallback: true, // включает авто-fallback логику
});
```

### Ручное переключение

```typescript
// Переключиться на opus вручную
modelSwitcher({ targetModel: 'opus' });

// Переключиться на minimax вручную
modelSwitcher({ targetModel: 'minimax' });
```

### Только глобальная модель

```typescript
// Обновить только глобальные настройки, не трогая агентов
modelSwitcher({
  targetModel: 'minimax',
  updateAgents: false,
});
```

---

## Важно знать

1. **Перезапуск требуется** — после переключения модели необходимо перезапустить opencode
2. **Изменения сохраняются** — новые настройки записываются в opencode.json
3. **Все агенты затрагиваются** — по умолчанию меняется и глобальная модель, и модель каждого агента
4. **Логирование** — всегда сообщай пользователю о причине переключения
