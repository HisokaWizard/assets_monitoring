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

import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
@UseGuards(AuthGuard('jwt'))
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
  async findOne(@Param('id') id: string) {
    const asset = await this.assetsService.findOne(+id);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }

  /**
   * Создать новый актив.
   *
   * @param createAssetDto Данные для создания актива из тела запроса.
   * @param req Запрос с пользователем из JWT токена.
   * @returns Созданный актив.
   * @Post декоратор обрабатывает POST запросы на '/assets'.
   * @Body извлекает данные из тела HTTP запроса.
   * @Request предоставляет доступ к объекту запроса с пользователем.
   */
  @Post()
  create(@Body() createAssetDto: CreateAssetDto, @Request() req) {
    return this.assetsService.create({ ...createAssetDto, userId: req.user.id });
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
  async update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    const asset = await this.assetsService.update(+id, updateAssetDto);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }

  /**
   * Удалить актив.
   *
   * @param id Идентификатор актива для удаления.
   * @Delete(':id') обрабатывает DELETE запросы на '/assets/:id'.
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const asset = await this.assetsService.findOne(+id);
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return this.assetsService.remove(+id);
  }
}
