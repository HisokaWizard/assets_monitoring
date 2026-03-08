/**
 * @fileoverview Тесты для UserSettingsController.
 *
 * Проверяет REST API endpoints для управления настройками пользователя.
 */

import { Test, TestingModule } from "@nestjs/testing";
import { UserSettingsController } from "./user-settings.controller";
import { UserSettingsService } from "./user-settings.service";
import { UserSettings } from "./core/entities/user-settings.entity";
import { UserRole } from "../auth/user-role.enum";

describe("UserSettingsController", () => {
  let controller: UserSettingsController;
  let service: UserSettingsService;

  const mockReq = {
    user: {
      id: 1,
      email: "test@example.com",
      password: "hashed",
      role: UserRole.USER,
    },
  };

  const mockService = {
    getUserSettings: jest.fn(),
    createSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSettingsController],
      providers: [
        {
          provide: UserSettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserSettingsController>(UserSettingsController);
    service = module.get<UserSettingsService>(UserSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should return user settings", async () => {
      const expectedSettings = { id: 1, userId: 1 } as UserSettings;
      mockService.getUserSettings.mockResolvedValue(expectedSettings);

      const result = await controller.getSettings(mockReq);

      expect(result).toEqual(expectedSettings);
      expect(service.getUserSettings).toHaveBeenCalledWith(mockReq.user);
    });

    it("should return null if no settings", async () => {
      mockService.getUserSettings.mockResolvedValue(null);

      const result = await controller.getSettings(mockReq);

      expect(result).toBeNull();
    });
  });

  describe("createSettings", () => {
    it("should create settings", async () => {
      const dto = { coinmarketcapApiKey: "test-key-32-chars-long-for-testing" };
      const expectedSettings = { id: 1, ...dto } as UserSettings;
      mockService.createSettings.mockResolvedValue(expectedSettings);

      const result = await controller.createSettings(mockReq, dto);

      expect(result).toEqual(expectedSettings);
      expect(service.createSettings).toHaveBeenCalledWith(mockReq.user, dto);
    });

    it("should pass correct dto to service", async () => {
      const dto = {
        coinmarketcapApiKey: "cmc-key-32-chars-long-for-test",
        openseaApiKey: "os-key-32-chars-long-for-test",
      };
      mockService.createSettings.mockResolvedValue({
        id: 1,
        ...dto,
      } as UserSettings);

      await controller.createSettings(mockReq, dto);

      expect(service.createSettings).toHaveBeenCalledWith(mockReq.user, dto);
    });
  });

  describe("updateSettings", () => {
    it("should update settings", async () => {
      const dto = { openseaApiKey: "new-key-32-chars-long-for-test" };
      const expectedSettings = { id: 1, ...dto } as UserSettings;
      mockService.updateSettings.mockResolvedValue(expectedSettings);

      const result = await controller.updateSettings(mockReq, dto);

      expect(result).toEqual(expectedSettings);
      expect(service.updateSettings).toHaveBeenCalledWith(mockReq.user, dto);
    });

    it("should handle partial update", async () => {
      const dto = { coinmarketcapApiKey: "updated-key-32-chars-long" };
      mockService.updateSettings.mockResolvedValue({
        id: 1,
        ...dto,
      } as UserSettings);

      await controller.updateSettings(mockReq, dto);

      expect(service.updateSettings).toHaveBeenCalledWith(mockReq.user, dto);
    });
  });
});
