import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

interface CacheEntry {
  content: string;
  timestamp: number;
  source: 'local' | 'github';
}

interface DocStructure {
  mainFile: string;
  sections: Map<string, string>;
}

const CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 часа
const LOCAL_BASE_PATH = '../documents_hub';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/HisokaWizard/documents_hub/main';

async function checkLocalPath(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.resolve(LOCAL_BASE_PATH, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readLocalFile(relativePath: string): Promise<string> {
  const fullPath = path.resolve(LOCAL_BASE_PATH, relativePath);
  return fs.readFile(fullPath, 'utf-8');
}

async function fetchFromGitHub(relativePath: string): Promise<string> {
  const url = `${GITHUB_RAW_BASE}/${relativePath}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch from GitHub: ${response.status} ${response.statusText}`);
  }
  
  return response.text();
}

async function getDocument(relativePath: string, forceRefresh: boolean = false): Promise<{ content: string; source: 'local' | 'github' }> {
  const cacheKey = relativePath;
  
  // Проверяем кэш
  if (!forceRefresh) {
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { content: cached.content, source: cached.source };
    }
  }
  
  // Пробуем локальный путь
  const hasLocal = await checkLocalPath(relativePath);
  
  if (hasLocal) {
    const content = await readLocalFile(relativePath);
    CACHE.set(cacheKey, { content, timestamp: Date.now(), source: 'local' });
    return { content, source: 'local' };
  }
  
  // Fallback на GitHub
  const content = await fetchFromGitHub(relativePath);
  CACHE.set(cacheKey, { content, timestamp: Date.now(), source: 'github' });
  return { content, source: 'github' };
}

function parseSections(content: string): string[] {
  // Ищем ссылки на разделы в формате markdown
  const sectionRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const sections: string[] = [];
  let match;
  
  while ((match = sectionRegex.exec(content)) !== null) {
    const [, name, link] = match;
    // Проверяем, что это ссылка на раздел (не внешняя ссылка)
    if (!link.startsWith('http') && !link.startsWith('#')) {
      sections.push(name);
    }
  }
  
  return sections;
}

async function getSectionContent(
  layer: string, 
  sectionName: string, 
  forceRefresh: boolean
): Promise<string> {
  // Преобразуем имя раздела в путь (UPPERCASE как в documents_hub)
  // Например: "nestjs" → "backend/NESTJS.md" или "frontend/REACT.md"
  const sectionPath = `${layer}/${sectionName.toUpperCase()}.md`;
  
  try {
    const { content } = await getDocument(sectionPath, forceRefresh);
    return content;
  } catch (error) {
    return `Section "${sectionName}" not found in ${layer}`;
  }
}

async function searchInAllFiles(
  layer: string,
  searchTerm: string,
  forceRefresh: boolean
): Promise<Array<{ file: string; matches: string[] }>> {
  const results: Array<{ file: string; matches: string[] }> = [];
  
  // Получаем список всех .md файлов в слое
  const layerPath = path.resolve(LOCAL_BASE_PATH, layer);
  
  try {
    const files = await fs.readdir(layerPath);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    for (const file of mdFiles) {
      const filePath = `${layer}/${file}`;
      try {
        const { content } = await getDocument(filePath, forceRefresh);
        
        // Ищем совпадения
        const searchRegex = new RegExp(searchTerm, 'gi');
        const matches: string[] = [];
        let match;
        
        while ((match = searchRegex.exec(content)) !== null) {
          // Получаем контекст вокруг совпадения (100 символов)
          const start = Math.max(0, match.index - 50);
          const end = Math.min(content.length, match.index + searchTerm.length + 50);
          const context = content.substring(start, end);
          matches.push(context.trim());
        }
        
        if (matches.length > 0) {
          results.push({ file: file.replace('.md', ''), matches });
        }
      } catch {
        // Пропускаем файлы которые не удалось прочитать
      }
    }
  } catch {
    // Если директория не существует
  }
  
  return results;
}

export default tool({
  description: 'Retrieve documentation from documents_hub for development context. Gets architecture guidelines, stack details, and best practices from local copy or GitHub fallback. Supports searching by topic name or content.',
  
  args: {
    layer: z.enum(['frontend', 'backend'])
      .describe('Which application layer to get documentation for'),
    
    topic: z.string()
      .optional()
      .describe('Specific topic to retrieve (e.g., "NESTJS", "REACT", "WEBPACK"). If not provided, returns main settings file'),
    
    section: z.string()
      .optional()
      .describe('Specific section within the topic to retrieve'),
    
    search: z.string()
      .optional()
      .describe('Search term to find in all documentation files (e.g., "webpack", "database"). Returns matching contexts from all files'),
    
    refresh: z.boolean()
      .optional()
      .default(false)
      .describe('Force refresh from source, bypassing cache'),
    
    listSections: z.boolean()
      .optional()
      .default(false)
      .describe('Return list of available sections instead of content')
  },
  
  async execute(args, context) {
    const { layer, topic, section, search, refresh, listSections } = args;
    const startTime = Date.now();
    
    // Если запрошен поиск по содержимому
    if (search) {
      const searchResults = await searchInAllFiles(layer, search, refresh);
      
      context.metadata({
        layer,
        searchTerm: search,
        resultsCount: searchResults.length,
        duration: Date.now() - startTime
      });
      
      if (searchResults.length === 0) {
        return {
          content: `No matches found for "${search}" in ${layer} documentation.`,
          searchTerm: search,
          layer,
          source: 'search'
        };
      }
      
      const formattedResults = searchResults.map(result => 
        `## ${result.file}\n${result.matches.slice(0, 3).map(m => `- ...${m}...`).join('\n')}`
      ).join('\n\n');
      
      return {
        content: `Search results for "${search}" in ${layer}:\n\n${formattedResults}`,
        searchTerm: search,
        layer,
        results: searchResults,
        source: 'search'
      };
    }
    
    // Определяем путь к главному файлу
    const mainFile = layer === 'frontend' 
      ? 'frontend/FE_APP_SETTINGS.md' 
      : 'backend/BE_APP_SETTINGS.md';
    
    try {
      // Получаем главный файл
      const { content: mainContent, source } = await getDocument(mainFile, refresh);
      
      context.metadata({
        layer,
        source,
        hasTopic: !!topic,
        hasSection: !!section,
        duration: Date.now() - startTime
      });
      
      // Если нужен только список разделов
      if (listSections) {
        const sections = parseSections(mainContent);
        return {
          content: `Available sections in ${layer}:\n${sections.map(s => `- ${s}`).join('\n')}`,
          sections,
          source,
          mainFile
        };
      }
      
      // Если запрошен конкретный топик
      if (topic) {
        const topicContent = await getSectionContent(layer, topic, refresh);
        
        // Если запрошен конкретный раздел внутри топика
        if (section) {
          // Ищем раздел по заголовку
          const sectionRegex = new RegExp(`##?\\s*${section}[^#]*`, 'i');
          const match = topicContent.match(sectionRegex);
          
          if (match) {
            return {
              content: match[0].trim(),
              source: source === 'local' ? 'local' : 'github',
              layer,
              topic,
              section
            };
          }
          
          return {
            content: `Section "${section}" not found in ${layer}/${topic}`,
            source: 'not_found',
            layer,
            topic
          };
        }
        
        return {
          content: topicContent,
          source: source === 'local' ? 'local' : 'github',
          layer,
          topic
        };
      }
      
      // Возвращаем главный файл
      return {
        content: mainContent,
        sections: parseSections(mainContent),
        source,
        layer,
        mainFile
      };
      
    } catch (error) {
      throw new Error(
        `Failed to retrieve documentation for ${layer}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
});
