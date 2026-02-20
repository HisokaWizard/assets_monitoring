# Sub-task 3: Создание Service

## Описание

Создать сервис `UserSettingsService` с бизнес-логикой для CRUD операций. Сервис должен шифровать API-ключи перед сохранением и дешифровать при получении.

## Способ решения

### Структура файла

Создать `backend/src/user-settings/user-settings.service.ts`:

```typescript
/**
 * @fileoverview Сервис настроек пользователя.
 *
 * Содержит бизнес-логику для работы с API-ключами пользователя.
 * Шифрует ключи перед сохранением и дешифрует при чтении.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { UserSettings } from './core/entities/user-settings.entity';
import { CreateUserSettingsDto, UpdateUserSettingsDto } from './core/dto';
import { User } from '../auth/user.entity';

@Injectable()
export class UserSettingsService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32;
  private readonly ivLength = 16;

  constructor(
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Получить настройки пользователя.
   * Дешифрует API-ключи перед возвратом.
   */
  async getUserSettings(user: User): Promise<UserSettings | null> {
    const settings = await this.userSettingsRepository.findOne({
      where: { userId: user.id },
    });

    if (!settings) {
      return null;
    }

    // Дешифруем ключи
    return this.decryptSettings(settings);
  }

  /**
   * Создать настройки пользователя.
   * Шифрует API-ключи перед сохранением.
   */
  async createSettings(
    user: User,
    dto: CreateUserSettingsDto,
  ): Promise<UserSettings> {
    // Проверяем, что настроек еще нет
    const existing = await this.userSettingsRepository.findOne({
      where: { userId: user.id },
    });

    if (existing) {
      throw new Error('User settings already exist. Use update instead.');
    }

    // Шифруем ключи
    const encryptedDto = await this.encryptDto(dto);

    const settings = this.userSettingsRepository.create({
      userId: user.id,
      ...encryptedDto,
    });

    const saved = await this.userSettingsRepository.save(settings);
    
    // Возвращаем с дешифрованными ключами
    return this.decryptSettings(saved);
  }

  /**
   * Обновить настройки пользователя.
   * Шифрует API-ключи перед сохранением.
   */
  async updateSettings(
    user: User,
    dto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    const settings = await this.userSettingsRepository.findOne({
      where: { userId: user.id },
    });

    if (!settings) {
      throw new NotFoundException('User settings not found');
    }

    // Шифруем ключи
    const encryptedDto = await this.encryptDto(dto);

    await this.userSettingsRepository.update(
      { userId: user.id },
      encryptedDto,
    );

    const updated = await this.userSettingsRepository.findOne({
      where: { userId: user.id },
    });

    // Возвращаем с дешифрованными ключами
    return this.decryptSettings(updated!);
  }

  /**
   * Шифрование DTO.
   */
  private async encryptDto(dto: CreateUserSettingsDto | UpdateUserSettingsDto): Promise<Partial<UserSettings>> {
    const result: Partial<UserSettings> = {};

    if (dto.coinmarketcapApiKey) {
      result.coinmarketcapApiKey = await this.encrypt(dto.coinmarketcapApiKey);
    }

    if (dto.openseaApiKey) {
      result.openseaApiKey = await this.encrypt(dto.openseaApiKey);
    }

    return result;
  }

  /**
   * Шифрование строки.
   */
  private async encrypt(text: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Сохраняем IV вместе с зашифрованными данными
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Дешифрование строки.
   */
  private async decrypt(encryptedText: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = createDecipheriv(this.algorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Дешифрование настроек.
   */
  private async decryptSettings(settings: UserSettings): Promise<UserSettings> {
    const decrypted = { ...settings };

    if (settings.coinmarketcapApiKey) {
      decrypted.coinmarketcapApiKey = await this.decrypt(settings.coinmarketcapApiKey);
    }

    if (settings.openseaApiKey) {
      decrypted.openseaApiKey = await this.decrypt(settings.openseaApiKey);
    }

    return decrypted;
  }

  /**
   * Получение ключа шифрования из конфигурации.
   */
  private async getEncryptionKey(): Promise<Buffer> {
    const password = this.configService.get<string>('API_KEYS_ENCRYPTION_KEY');
    if (!password) {
      throw new Error('API_KEYS_ENCRYPTION_KEY is not defined');
    }

    const salt = Buffer.from('fixed_salt_for_user_settings', 'utf8');
    const key = (await promisify(scrypt)(password, salt, this.keyLength)) as Buffer;
    return key;
  }
}
```

### Альтернатива: Простое шифрование

Если AES-256-CBC слишком сложно, можно использовать библиотеку `cryptr`:

```typescript
import * as Cryptr from 'cryptr';

private getCryptr(): Cryptr {
  const secret = this.configService.get<string>('API_KEYS_ENCRYPTION_KEY');
  return new Cryptr(secret);
}

private encrypt(text: string): string {
  return this.getCryptr().encrypt(text);
}

private decrypt(encrypted: string): string {
  return this.getCryptr().decrypt(encrypted);
}
```

## Подготовка тесткейсов для TDD

### Unit-тесты для Service

1. **getUserSettings**
   - Тест: возвращает null если настроек нет
   - Тест: возвращает настройки с дешифрованными ключами
   - Тест: правильно дешифрует оба ключа

2. **createSettings**
   - Тест: создает настройки с зашифрованными ключами
   - Тест: возвращает созданные настройки с дешифрованными ключами
   - Тест: выбрасывает ошибку если настройки уже существуют
   - Тест: создает настройки только с одним ключом
   - Тест: создает настройки без ключей (оба undefined)

3. **updateSettings**
   - Тест: обновляет существующие настройки
   - Тест: шифрует ключи при обновлении
   - Тест: возвращает обновленные настройки с дешифрованными ключами
   - Тест: выбрасывает NotFoundException если настроек нет
   - Тест: частичное обновление (только один ключ)

4. **Encryption/Decryption**
   - Тест: encrypt шифрует строку
   - Тест: decrypt дешифрует строку обратно
   - Тест: разные строки дают разные зашифрованные значения (IV)
   - Тест: дешифрование зашифрованной строки возвращает оригинал

5. **Error handling**
   - Тест: обработка отсутствия API_KEYS_ENCRYPTION_KEY
   - Тест: обработка ошибок шифрования
   - Тест: обработка ошибок дешифрования (corrupted data)

### Интеграционные тесты

6. **Database operations**
   - Тест: данные сохраняются в БД зашифрованными
   - Тест: данные читаются из БД и дешифруются
   - Тест: каскадное удаление при удалении пользователя

### Mock-тесты

7. **Repository mocking**
   - Тест: правильные вызовы findOne, create, save, update
   - Тест: правильные where условия (userId)

## Ожидаемый результат

- Файл `user-settings.service.ts` создан
- Реализованы методы: getUserSettings, createSettings, updateSettings
- API-ключи шифруются перед сохранением
- API-ключи дешифруются при получении
- Все методы покрыты тестами

## Критерии приёмки

- [ ] Service создан согласно спецификации
- [ ] Шифрование реализовано (AES-256-CBC или cryptr)
- [ ] Методы обрабатывают все edge cases
- [ ] Ошибки обрабатываются корректно
- [ ] Unit-тесты проходят (>80% coverage)
- [ ] Интеграционные тесты проходят
