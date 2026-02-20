/**
 * @fileoverview Сервис настроек пользователя.
 *
 * Содержит бизнес-логику для работы с API-ключами пользователя.
 * Шифрует ключи перед сохранением и дешифрует при чтении.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
   * Получение ключа шифрования из переменных окружения.
   */
  private async getEncryptionKey(): Promise<Buffer> {
    const password = process.env.API_KEYS_ENCRYPTION_KEY;
    if (!password) {
      throw new Error('API_KEYS_ENCRYPTION_KEY is not defined');
    }

    const salt = Buffer.from('fixed_salt_for_user_settings', 'utf8');
    const key = (await promisify(scrypt)(password, salt, this.keyLength)) as Buffer;
    return key;
  }
}
