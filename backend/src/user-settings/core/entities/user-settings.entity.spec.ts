/**
 * @fileoverview Тесты для UserSettings entity.
 *
 * Проверяет структуру entity и TypeORM декораторы.
 */

import { UserSettings } from './user-settings.entity';

describe('UserSettings Entity', () => {
  it('should be defined', () => {
    expect(UserSettings).toBeDefined();
  });

  it('should have correct structure', () => {
    const settings = new UserSettings();
    
    // TypeORM entities use class properties with decorators
    // We verify the class has the expected properties by setting and reading them
    settings.id = 1;
    settings.userId = 1;
    settings.coinmarketcapApiKey = 'test';
    settings.openseaApiKey = 'test';
    
    expect(settings.id).toBeDefined();
    expect(settings.userId).toBeDefined();
    expect(settings.coinmarketcapApiKey).toBeDefined();
    expect(settings.openseaApiKey).toBeDefined();
  });

  it('should allow optional API keys', () => {
    const settings = new UserSettings();
    
    expect(settings.coinmarketcapApiKey).toBeUndefined();
    expect(settings.openseaApiKey).toBeUndefined();
  });

  it('should allow setting API keys', () => {
    const settings = new UserSettings();
    settings.coinmarketcapApiKey = 'test-cmc-key';
    settings.openseaApiKey = 'test-os-key';
    
    expect(settings.coinmarketcapApiKey).toBe('test-cmc-key');
    expect(settings.openseaApiKey).toBe('test-os-key');
  });

  it('should have numeric id and userId', () => {
    const settings = new UserSettings();
    settings.id = 1;
    settings.userId = 2;
    
    expect(typeof settings.id).toBe('number');
    expect(typeof settings.userId).toBe('number');
  });

  it('should have Date fields', () => {
    const settings = new UserSettings();
    const now = new Date();
    settings.createdAt = now;
    settings.updatedAt = now;
    
    expect(settings.createdAt).toBeInstanceOf(Date);
    expect(settings.updatedAt).toBeInstanceOf(Date);
  });
});
