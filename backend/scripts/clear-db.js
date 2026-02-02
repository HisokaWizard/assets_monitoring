/**
 * @fileoverview Скрипт для очистки базы данных SQLite.
 *
 * Удаляет все записи из всех таблиц и сбрасывает автоинкремент.
 */

const { createConnection } = require('typeorm');
const fs = require('fs');
const path = require('path');

async function clearDatabase() {
  console.log('='.repeat(50));
  console.log('🗑️  ОЧИСТКА БАЗЫ ДАННЫХ');
  console.log('='.repeat(50));
  console.log();

  const dbPath = path.join(__dirname, '..', 'database.sqlite');

  // Проверяем существование файла базы данных
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  База данных не существует. Нечего очищать.');
    return;
  }

  const connection = await createConnection({
    type: 'sqlite',
    database: dbPath,
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  try {
    // Получаем имена всех таблиц
    const tables = await connection.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );

    console.log(`📋 Найдено таблиц: ${tables.length}`);

    // Очищаем каждую таблицу
    for (const table of tables) {
      const tableName = table.name;
      await connection.query(`DELETE FROM "${tableName}"`);
      // Сбрасываем автоинкремент
      await connection.query(`DELETE FROM sqlite_sequence WHERE name="${tableName}"`);
      console.log(`  ✅ Таблица "${tableName}" очищена`);
    }

    console.log();
    console.log('='.repeat(50));
    console.log('✅ База данных успешно очищена');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Ошибка при очистке базы данных:', error.message);
  } finally {
    await connection.close();
  }
}

clearDatabase().catch(console.error);
