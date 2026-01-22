/**
 * @fileoverview DTO для создания нового актива.
 *
 * Этот файл определяет структуру данных для запросов на создание активов.
 * DTO (Data Transfer Object) в NestJS используются для валидации входных данных,
 * типизации и передачи данных между слоями приложения.
 *
 * Class-validator предоставляет декораторы для автоматической валидации
 * полей на основе правил (например, @IsString, @IsNotEmpty, @IsEnum).
 */

import { IsString, IsNumber, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

/**
 * DTO для создания актива.
 *
 * Поддерживает создание активов типов 'crypto' и 'nft'.
 * Общие поля обязательны: amount, middlePrice.
 * Специфичные поля опциональны, но требуются в зависимости от типа.
 * Все поля валидируются с помощью декораторов class-validator,
 * что обеспечивает корректность данных перед их обработкой.
 */
export class CreateAssetDto {
  /**
   * Тип актива.
   *
   * Должен быть одним из: 'crypto' или 'nft'.
   * @IsEnum() проверяет, что значение входит в список допустимых.
   */
  @IsEnum(['crypto', 'nft'])
  type: 'crypto' | 'nft';

  /**
   * Количество актива.
   *
   * Должно быть числом.
   * @IsNumber() валидирует числовой тип.
   * @IsNotEmpty() гарантирует, что значение не пустое.
   */
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  /**
   * Средняя цена актива.
   *
   * Должно быть числом.
   * @IsNumber() валидирует числовой тип.
   * @IsNotEmpty() гарантирует, что значение не пустое.
   */
  @IsNumber()
  @IsNotEmpty()
  middlePrice: number;

  /**
   * Символ актива (для crypto).
   *
   * Требуется для типа 'crypto'. Опционально для 'nft'.
   * @IsOptional() делает поле опциональным.
   * @IsString() проверяет, что значение является строкой.
   */
  @IsOptional()
  @IsString()
  symbol?: string;

  /**
   * Полное название актива (для crypto).
   *
   * Требуется для типа 'crypto'. Опционально для 'nft'.
   * @IsOptional() делает поле опциональным.
   * @IsString() проверяет, что значение является строкой.
   */
  @IsOptional()
  @IsString()
  fullName?: string;

  /**
   * Текущая цена актива (для crypto).
   *
   * Требуется для типа 'crypto'. Опционально для 'nft'.
   * @IsOptional() делает поле опциональным.
   * @IsNumber() валидирует числовой тип.
   */
  @IsOptional()
  @IsNumber()
  currentPrice?: number;

  /**
   * Название коллекции (для nft).
   *
   * Требуется для типа 'nft'. Опционально для 'crypto'.
   * @IsOptional() делает поле опциональным.
   * @IsString() проверяет, что значение является строкой.
   */
  @IsOptional()
  @IsString()
  collectionName?: string;

  /**
   * Минимальная цена в коллекции (для nft).
   *
   * Требуется для типа 'nft'. Опционально для 'crypto'.
   * @IsOptional() делает поле опциональным.
   * @IsNumber() валидирует числовой тип.
   */
  @IsOptional()
  @IsNumber()
  floorPrice?: number;

  /**
   * Цена по признаку (для nft).
   *
   * Требуется для типа 'nft'. Опционально для 'crypto'.
   * @IsOptional() делает поле опциональным.
   * @IsNumber() валидирует числовой тип.
   */
  @IsOptional()
  @IsNumber()
  traitPrice?: number;
}
