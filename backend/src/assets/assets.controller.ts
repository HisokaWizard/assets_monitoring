/**
 * @fileoverview Контроллер для управления активами.
 *
 * Этот файл определяет REST API endpoints для работы с активами.
 * Контроллеры в NestJS обрабатывают HTTP запросы, валидируют входные данные,
 * вызывают соответствующие методы сервисов и возвращают ответы.
 *
 * Декораторы @Controller, @Get, @Post и т.д. определяют маршруты и методы HTTP.
 * @Controller('assets') создает префикс '/assets' для всех маршрутов контроллера.
 */

import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

/**
 * Контроллер для операций с активами.
 *
 * Предоставляет REST API для CRUD операций над активами.
 * Все маршруты имеют префикс '/assets'.
 *
 * @Controller декоратор регистрирует класс как контроллер,
 * который обрабатывает HTTP запросы по указанному пути.
 */
@Controller('assets')
export class AssetsController {
  /**
   * Конструктор контроллера.
   *
   * @param assetsService Сервис для бизнес-логики активов.
   * Dependency injection автоматически предоставляет экземпляр сервиса.
   */
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * Получить все активы.
   *
   * @returns Массив всех активов.
   * @Get декоратор обрабатывает GET запросы на '/assets'.
   */
  @Get()
  findAll() {
    return this.assetsService.findAll();
  }

  /**
   * Получить актив по ID.
   *
   * @param id Идентификатор актива из URL параметра.
   * @returns Актив или null, если не найден.
   * @Get(':id') обрабатывает GET запросы на '/assets/:id'.
   * @Param('id') извлекает параметр из URL.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(+id);
  }

  /**
   * Создать новый актив.
   *
   * @param createAssetDto Данные для создания актива из тела запроса.
   * @returns Созданный актив.
   * @Post декоратор обрабатывает POST запросы на '/assets'.
   * @Body извлекает данные из тела HTTP запроса.
   */
  @Post()
  create(@Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create(createAssetDto);
  }

  /**
   * Обновить существующий актив.
   *
   * @param id Идентификатор актива.
   * @param updateAssetDto Данные для обновления.
   * @returns Обновленный актив.
   * @Put(':id') обрабатывает PUT запросы на '/assets/:id'.
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(+id, updateAssetDto);
  }

  /**
   * Удалить актив.
   *
   * @param id Идентификатор актива для удаления.
   * @Delete(':id') обрабатывает DELETE запросы на '/assets/:id'.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(+id);
  }
}
