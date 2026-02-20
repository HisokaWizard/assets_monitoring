/**
 * @fileoverview Тесты для CreateUserSettingsDto.
 *
 * Проверяет валидацию DTO с использованием class-validator.
 */

import { validate } from 'class-validator';
import { CreateUserSettingsDto } from './create-user-settings.dto';

describe('CreateUserSettingsDto', () => {
  it('should be defined', () => {
    expect(CreateUserSettingsDto).toBeDefined();
  });

  it('should accept valid coinmarketcapApiKey', async () => {
    const dto = new CreateUserSettingsDto();
    dto.coinmarketcapApiKey = 'test-key-32-chars-long-for-cmc-api';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid openseaApiKey', async () => {
    const dto = new CreateUserSettingsDto();
    dto.openseaApiKey = 'test-key-32-chars-long-for-opensea-api';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept both keys', async () => {
    const dto = new CreateUserSettingsDto();
    dto.coinmarketcapApiKey = 'test-key-32-chars-long-for-cmc-api';
    dto.openseaApiKey = 'test-key-32-chars-long-for-opensea-api';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept empty object (optional fields)', async () => {
    const dto = new CreateUserSettingsDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject coinmarketcapApiKey shorter than 20 chars', async () => {
    const dto = new CreateUserSettingsDto();
    dto.coinmarketcapApiKey = 'short-key';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('coinmarketcapApiKey');
  });

  it('should reject openseaApiKey shorter than 20 chars', async () => {
    const dto = new CreateUserSettingsDto();
    dto.openseaApiKey = 'short-key';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('openseaApiKey');
  });

  it('should reject coinmarketcapApiKey longer than 500 chars', async () => {
    const dto = new CreateUserSettingsDto();
    dto.coinmarketcapApiKey = 'a'.repeat(501);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('coinmarketcapApiKey');
  });

  it('should reject openseaApiKey longer than 500 chars', async () => {
    const dto = new CreateUserSettingsDto();
    dto.openseaApiKey = 'b'.repeat(501);

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('openseaApiKey');
  });

  it('should reject non-string coinmarketcapApiKey', async () => {
    const dto = new CreateUserSettingsDto();
    (dto as any).coinmarketcapApiKey = 12345;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should accept exactly 20 chars key (boundary)', async () => {
    const dto = new CreateUserSettingsDto();
    dto.coinmarketcapApiKey = 'a'.repeat(20);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept exactly 500 chars key (boundary)', async () => {
    const dto = new CreateUserSettingsDto();
    dto.coinmarketcapApiKey = 'b'.repeat(500);

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
