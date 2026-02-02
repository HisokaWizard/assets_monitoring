/**
 * @fileoverview Скрипт для полного сброса базы данных SQLite.
 *
 * Удаляет файл database.sqlite и запускает seed скрипт заново.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function resetDatabase() {
  console.log('='.repeat(50));
  console.log('🔄 ПОЛНЫЙ СБРОС БАЗЫ ДАННЫХ');
  console.log('='.repeat(50));
  console.log();

  const dbPath = path.join(__dirname, '..', 'database.sqlite');

  // Проверяем существование файла базы данных
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️  Файл базы данных удален');
  } else {
    console.log('⚠️  Файл базы данных не существует');
  }

  console.log('🌱 Запуск seed скрипта...');
  console.log();

  // Запускаем seed скрипт
  const seedProcess = spawn('npx', ['ts-node', 'src/seed.ts'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  seedProcess.on('close', (code) => {
    if (code === 0) {
      console.log();
      console.log('='.repeat(50));
      console.log('✅ База данных успешно сброшена и заполнена');
      console.log('='.repeat(50));
    } else {
      console.error(`❌ Seed скрипт завершился с кодом ${code}`);
    }
  });

  seedProcess.on('error', (error) => {
    console.error('❌ Ошибка при запуске seed скрипта:', error.message);
  });
}

resetDatabase();
