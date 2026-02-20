/**
 * @fileoverview Тесты для UserSettingsModule.
 *
 * Проверяет конфигурацию модуля и интеграцию компонентов.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSettingsModule } from './user-settings.module';
import { UserSettingsService } from './user-settings.service';
import { UserSettingsController } from './user-settings.controller';
import { UserSettings } from './core/entities/user-settings.entity';

describe('UserSettingsModule', () => {
  let module: TestingModule;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    // Set encryption key for testing
    process.env.API_KEYS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-long!!';

    module = await Test.createTestingModule({
      imports: [UserSettingsModule],
    })
      .overrideProvider(getRepositoryToken(UserSettings))
      .useValue(mockRepository)
      .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide UserSettingsService', () => {
    const service = module.get<UserSettingsService>(UserSettingsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(UserSettingsService);
  });

  it('should provide UserSettingsController', () => {
    const controller = module.get<UserSettingsController>(UserSettingsController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(UserSettingsController);
  });
});
