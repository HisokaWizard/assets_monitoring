/**
 * @fileoverview Интерактивный скрипт для работы с базой данных SQLite.
 *
 * Предоставляет меню для выполнения различных операций с базой данных.
 */

const { createConnection } = require('typeorm');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Создаем интерфейс для чтения ввода
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Отображает главное меню
 */
function showMenu() {
  console.log();
  console.log('='.repeat(50));
  console.log('🗄️  ИНТЕРАКТИВНАЯ РАБОТА С БАЗОЙ ДАННЫХ');
  console.log('='.repeat(50));
  console.log();
  console.log('Выберите действие:');
  console.log('1. 📊 Просмотр всех таблиц и данных');
  console.log('2. ➕ Добавление тестовых данных (seed)');
  console.log('3. 🗑️  Очистка базы данных');
  console.log('4. 🔄 Полный сброс базы данных');
  console.log('5. ❌ Выход');
  console.log();
  rl.question('Введите номер действия: ', (answer) => {
    console.log();
    switch (answer.trim()) {
      case '1':
        viewAllTables();
        break;
      case '2':
        runSeed();
        break;
      case '3':
        clearDatabase();
        break;
      case '4':
        resetDatabase();
        break;
      case '5':
        console.log('👋 До свидания!');
        rl.close();
        break;
      default:
        console.log('❌ Неверный выбор. Попробуйте снова.');
        showMenu();
        break;
    }
  });
}

/**
 * Просмотр всех таблиц и данных
 */
async function viewAllTables() {
  console.log('📊 ПРОСМОТР ВСЕХ ТАБЛИЦ');
  console.log('-'.repeat(50));

  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  База данных не существует.');
    showMenu();
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
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );

    for (const table of tables) {
      const tableName = table.name;
      console.log(`\n📋 Таблица: ${tableName}`);

      // Получаем количество записей
      const count = await connection.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      console.log(`   Записей: ${count[0].count}`);

      // Показываем первые 5 записей
      const rows = await connection.query(`SELECT * FROM "${tableName}" LIMIT 5`);
      if (rows.length > 0) {
        console.log('   Первые записи:');
        rows.forEach((row, index) => {
          const cleanRow = { ...row };
          // Удаляем служебные поля
          delete cleanRow.id;
          delete cleanRow.createdAt;
          delete cleanRow.updatedAt;
          const preview = JSON.stringify(cleanRow).substring(0, 100);
          console.log(`   ${index + 1}. ${preview}...`);
        });
      }
    }

    console.log();
    showMenu();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    showMenu();
  } finally {
    await connection.close();
  }
}

/**
 * Запуск seed скрипта
 */
function runSeed() {
  console.log('🌱 ЗАПУСК SEED СКРИПТА');
  console.log('-'.repeat(50));

  const seedProcess = spawn('npx', ['ts-node', 'src/seed.ts'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  seedProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Тестовые данные добавлены');
    } else {
      console.log(`\n❌ Seed скрипт завершился с кодом ${code}`);
    }
    showMenu();
  });

  seedProcess.on('error', (error) => {
    console.error('❌ Ошибка при запуске seed скрипта:', error.message);
    showMenu();
  });
}

/**
 * Очистка базы данных
 */
async function clearDatabase() {
  console.log('🗑️  ОЧИСТКА БАЗЫ ДАННЫХ');
  console.log('-'.repeat(50));

  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  База данных не существует.');
    showMenu();
    return;
  }

  const connection = await createConnection({
    type: 'sqlite',
    database: dbPath,
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  try {
    const tables = await connection.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );

    for (const table of tables) {
      const tableName = table.name;
      await connection.query(`DELETE FROM "${tableName}"`);
      await connection.query(`DELETE FROM sqlite_sequence WHERE name="${tableName}"`);
    }

    console.log('✅ База данных очищена');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await connection.close();
    showMenu();
  }
}

/**
 * Полный сброс базы данных
 */
function resetDatabase() {
  console.log('🔄 ПОЛНЫЙ СБРОС БАЗЫ ДАННЫХ');
  console.log('-'.repeat(50));

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Файл базы данных удален');
  }

  console.log('🌱 Запуск seed скрипта...');

  const seedProcess = spawn('npx', ['ts-node', 'src/seed.ts'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  seedProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ База данных сброшена и заполнена');
    } else {
      console.log(`\n❌ Seed скрипт завершился с кодом ${code}`);
    }
    showMenu();
  });

  seedProcess.on('error', (error) => {
    console.error('❌ Ошибка:', error.message);
    showMenu();
  });
}

// Запуск интерактивного режима
console.log('🚀 Запуск интерактивного режима работы с базой данных...');
showMenu();
