/**
 * @fileoverview Скрипт для заполнения базы данных тестовыми данными.
 *
 * Этот файл создает начальные данные: пользователей (admin и user) и их активы (криптовалюты и NFT).
 * Используется для тестирования и демонстрации функциональности системы.
 */

import { createConnection } from 'typeorm';
import { User } from './auth/user.entity';
import { Asset, CryptoAsset, NFTAsset } from './assets/asset.entity';
import * as bcrypt from 'bcrypt';

/**
 * Функция для заполнения базы данных тестовыми данными.
 */
async function seed() {
  // Создание подключения к базе данных
  const connection = await createConnection({
    type: 'sqlite',
    database: 'database.sqlite',
    entities: [User, Asset, CryptoAsset, NFTAsset],
    synchronize: true,
  });

  const userRepo = connection.getRepository(User);
  const cryptoRepo = connection.getRepository(CryptoAsset);
  const nftRepo = connection.getRepository(NFTAsset);

  // Создание администратора
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepo.create({
    email: 'admin@example.com',
    password: adminPassword,
    role: 'admin',
  });
  await userRepo.save(admin);

  // Создание обычного пользователя
  const userPassword = await bcrypt.hash('user123', 10);
  const user = userRepo.create({
    email: 'user@example.com',
    password: userPassword,
    role: 'user',
  });
  await userRepo.save(user);

  // Создание активов для каждого пользователя
  const users = [admin, user];
  for (const u of users) {
    // BTC
    const btc = cryptoRepo.create({
      amount: 0.5,
      middlePrice: 45000,
      previousPrice: 45000,
      multiple: 1,
      dailyChange: 0,
      weeklyChange: 0,
      monthlyChange: 0,
      quartChange: 0,
      yearChange: 0,
      totalChange: 0,
      userId: u.id,
      symbol: 'BTC',
      fullName: 'Bitcoin',
      currentPrice: 45000,
    });
    await cryptoRepo.save(btc);

    // ETH
    const eth = cryptoRepo.create({
      amount: 2.0,
      middlePrice: 3000,
      previousPrice: 3000,
      multiple: 1,
      dailyChange: 0,
      weeklyChange: 0,
      monthlyChange: 0,
      quartChange: 0,
      yearChange: 0,
      totalChange: 0,
      userId: u.id,
      symbol: 'ETH',
      fullName: 'Ethereum',
      currentPrice: 3000,
    });
    await cryptoRepo.save(eth);

    // Bored Ape Yacht Club
    const bored = nftRepo.create({
      amount: 1,
      middlePrice: 50000,
      previousPrice: 50000,
      multiple: 1,
      dailyChange: 0,
      weeklyChange: 0,
      monthlyChange: 0,
      quartChange: 0,
      yearChange: 0,
      totalChange: 0,
      userId: u.id,
      collectionName: 'boredapeyachtclub',
      floorPrice: 45000,
      traitPrice: 45000,
    });
    await nftRepo.save(bored);

    // CryptoPunks
    const punks = nftRepo.create({
      amount: 1,
      middlePrice: 40000,
      previousPrice: 40000,
      multiple: 1,
      dailyChange: 0,
      weeklyChange: 0,
      monthlyChange: 0,
      quartChange: 0,
      yearChange: 0,
      totalChange: 0,
      userId: u.id,
      collectionName: 'cryptopunks',
      floorPrice: 35000,
      traitPrice: 35000,
    });
    await nftRepo.save(punks);
  }

  await connection.close();
  console.log('Seeding completed');
}

// Запуск скрипта
seed().catch(console.error);
