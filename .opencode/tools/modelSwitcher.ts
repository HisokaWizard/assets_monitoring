/**
 * ============================================================================
 * modelSwitcher — тул для переключения модели AI в opencode.json
 * ============================================================================
 *
 * Назначение:
 *   Позволяет агентам динамически переключать модель AI для всех агентов
 *   в конфигурации opencode.json. Используется для отказоустойчивости:
 *   при недоступности основной модели — автоматическое переключение на fallback.
 *
 * Поддерживаемые модели:
 *   - anthropic/claude-opus-4-6 (основная модель)
 *   - opencode/minimax-m2.5-free (fallback модель)
 *
 * API (параметры вызова):
 *
 *   targetModel (обязательный): "opus" | "minimax"
 *     Какую модель установить:
 *     - "opus" → anthropic/claude-opus-4-6
 *     - "minimax" → opencode/minimax-m2.5-free
 *
 *   fallback (опциональный): boolean (default: false)
 *     Если true — при ошибке переключения автоматически переключается на minimax.
 *
 *   updateAgents (опциональтельный): boolean (default: true)
 *     Обновить модель для всех агентов (agent.*.model).
 *     Если false — обновляется только глобальная модель (model, small_model).
 *
 * Примеры вызовов:
 *
 *   // Переключиться на opus 4.6
 *   modelSwitcher({ targetModel: "opus" })
 *
 *   // Переключиться на minimax с авто-fallback
 *   modelSwitcher({ targetModel: "minimax", fallback: true })
 *
 *   // Только глобальная модель (без агентов)
 *   modelSwitcher({ targetModel: "opus", updateAgents: false })
 *
 * Поведение:
 *   1. Читает текущий opencode.json
 *   2. Заменяет модель в указанных местах
 *   3. Записывает обновлённый конфиг обратно
 *   4. Возвращает результат с информацией о выполненных изменениях
 *
 * ============================================================================
 */

import { tool, type ToolContext } from '@opencode-ai/plugin';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

interface OpenCodeConfig {
  model: string;
  small_model: string;
  agent?: Record<string, { model: string }>;
}

const MODEL_MAP = {
  opus: 'anthropic/claude-opus-4-6',
  minimax: 'opencode/minimax-m2.5-free',
} as const;

export default tool({
  description:
    'Переключение модели AI в opencode.json. При недоступности одной модели ' +
    'можно переключиться на другую (claude-opus-4-6 ↔ minimax).',

  args: {
    targetModel: z
      .enum(['opus', 'minimax'])
      .describe(
        'Какую модель установить: "opus" (anthropic/claude-opus-4-6) или "minimax" (opencode/minimax-m2.5-free)',
      ),

    fallback: z
      .boolean()
      .optional()
      .default(false)
      .describe('Автоматически переключиться на minimax при ошибке'),

    updateAgents: z
      .boolean()
      .optional()
      .default(true)
      .describe('Обновить модель для всех агентов (agent.*.model)'),
  },

  async execute(args, context: ToolContext): Promise<string> {
    const { targetModel, fallback, updateAgents } = args;
    const targetModelString = MODEL_MAP[targetModel];

    // Определяем путь к opencode.json
    const projectRoot = context.directory || process.cwd();
    const configPath = path.resolve(projectRoot, 'opencode.json');

    try {
      // Читаем текущую конфигурацию
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config: OpenCodeConfig = JSON.parse(configContent);

      let changes: string[] = [];

      // Обновляем глобальные модели
      if (config.model !== targetModelString) {
        config.model = targetModelString;
        changes.push(`model: ${targetModelString}`);
      }
      if (config.small_model !== targetModelString) {
        config.small_model = targetModelString;
        changes.push(`small_model: ${targetModelString}`);
      }

      // Обновляем модели агентов
      if (updateAgents && config.agent) {
        for (const [agentName, agentConfig] of Object.entries(config.agent)) {
          if (agentConfig.model !== targetModelString) {
            agentConfig.model = targetModelString;
            changes.push(`agent.${agentName}.model: ${targetModelString}`);
          }
        }
      }

      if (changes.length === 0) {
        return `Модель уже установлена: ${targetModelString}. Изменений не требуется.`;
      }

      // Записываем обновлённую конфигурацию
      await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

      return `Модель переключена на ${targetModelString}.\nВыполненные изменения:\n${changes.map((c) => `  - ${c}`).join('\n')}\n\n⚠️ Перезапустите opencode для применения изменений.`;
    } catch (error) {
      if (fallback && targetModel !== 'minimax') {
        // Автоматический fallback на minimax
        try {
          const fallbackResult = await executeWithModel('minimax', context);
          return `Ошибка переключения на ${targetModelString}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}\n\nВыполнен автоматический fallback:\n${fallbackResult}`;
        } catch (fallbackError) {
          throw new Error(
            `Ошибка переключения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
          );
        }
      }

      throw new Error(
        `Не удалось переключить модель: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      );
    }
  },
});

// Вспомогательная функция для fallback
async function executeWithModel(model: 'opus' | 'minimax', context: ToolContext): Promise<string> {
  const modelString = MODEL_MAP[model];
  const projectRoot = context.directory || process.cwd();
  const configPath = path.resolve(projectRoot, 'opencode.json');

  const configContent = await fs.readFile(configPath, 'utf-8');
  const config: OpenCodeConfig = JSON.parse(configContent);

  config.model = modelString;
  config.small_model = modelString;

  if (config.agent) {
    for (const agentConfig of Object.values(config.agent)) {
      agentConfig.model = modelString;
    }
  }

  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

  return `model → ${modelString}\nВсе агенты обновлены → ${modelString}`;
}
