/**
 * @fileoverview Скрипт для просмотра данных в базе данных SQLite.
 *
 * Показывает статистику по всем таблицам базы данных:
 * - Количество пользователей
 * - Количество активов (криптовалюты и NFT)
 * - Количество настроек уведомлений
 * - Количество логов уведомлений
 */

const { createConnection } = require('typeorm');

async function viewDatabase() {
  console.log('='.repeat(50));
  console.log('📊 СТАТИСТИКА БАЗЫ ДАННЫХ');
  console.log('='.repeat(50));
  console.log();

  const connection = await createConnection({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  try {
    // Подсчет пользователей
    const userCount = await connection.query('SELECT COUNT(*) as count FROM user');
    console.log(`👥 Пользователи: ${userCount[0].count}`);

    // Подсчет криптовалют
    const cryptoCount = await connection.query('SELECT COUNT(*) as count FROM crypto_asset');
    console.log(`💰 Криптовалюты: ${cryptoCount[0].count}`);

    // Подсчет NFT
    const nftCount = await connection.query('SELECT COUNT(*) as count FROM nft_asset');
    console.log(`🖼️  NFT: ${nftCount[0].count}`);

    // Общее количество активов
    const totalAssets = parseInt(cryptoCount[0].count) + parseInt(nftCount[0].count);
    console.log(`📈 Всего активов: ${totalAssets}`);

    // Подсчет настроек уведомлений
    const settingsCount = await connection.query(
      'SELECT COUNT(*) as count FROM notification_settings',
    );
    console.log(`🔔 Настройки уведомлений: ${settingsCount[0].count}`);

    // Подсчет логов уведомлений
    const logsCount = await connection.query('SELECT COUNT(*) as count FROM notification_log');
    console.log(`📝 Логи уведомлений: ${logsCount[0].count}`);

    console.log();
    console.log('='.repeat(50));
    console.log('✅ Просмотр завершен');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Ошибка при просмотре базы данных:', error.message);
  } finally {
    await connection.close();
  }
}

viewDatabase().catch(console.error);
