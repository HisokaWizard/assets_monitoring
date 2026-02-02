#!/usr/bin/env tsx
import { createMcpServer } from '@langchain/langgraph-mcp';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// === 1. Определяем наши инструменты с помощью Zod-схем ===
// Библиотека автоматически преобразует эти схемы в inputSchema для MCP.

const createFile = {
  name: 'createFile',
  description: 'Создает файл по указанному пути с заданным содержимым.',
  inputSchema: z.object({
    filePath: z.string().describe('Полный путь к файлу.'),
    content: z.string().describe('Содержимое файла.'),
  }),
  func: async ({ filePath, content }: { filePath: string; content: string }) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true, message: `File ${filePath} created.` };
  },
};

const readFile = {
  name: 'readFile',
  description: 'Читает содержимое файла по указанному пути.',
  inputSchema: z.object({
    filePath: z.string().describe('Полный путь к файлу.'),
  }),
  func: async ({ filePath }: { filePath: string }) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return { content };
  },
};

const createDirectory = {
  name: 'createDirectory',
  description: 'Создает директорию по указанному пути.',
  inputSchema: z.object({
    dirPath: z.string().describe('Полный путь к директории.'),
  }),
  func: async ({ dirPath }: { dirPath: string }) => {
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true, message: `Directory ${dirPath} created.` };
  },
};

const deleteFile = {
  name: 'deleteFile',
  description: 'Удаляет файл по указанному пути.',
  inputSchema: z.object({
    filePath: z.string().describe('Полный путь к файлу.'),
  }),
  func: async ({ filePath }: { filePath: string }) => {
    fs.unlinkSync(filePath);
    return { success: true, message: `File ${filePath} deleted.` };
  },
};

const deleteDirectory = {
  name: 'deleteDirectory',
  description: 'Рекурсивно удаляет директорию по указанному пути.',
  inputSchema: z.object({
    dirPath: z.string().describe('Полный путь к директории.'),
  }),
  func: async ({ dirPath }: { dirPath: string }) => {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return { success: true, message: `Directory ${dirPath} deleted.` };
  },
};

// === 2. Регистрируем все инструменты в сервере ===
const server = createMcpServer({
  tools: [createFile, readFile, createDirectory, deleteFile, deleteDirectory],
  // Вы можете добавить другие возможности MCP, например, работу с ресурсами
});

// === 3. Запускаем сервер, который будет слушать stdin/stdout ===
// Это одна строка! Вся сложность обработки буфера скрыта внутри.
server.run();
