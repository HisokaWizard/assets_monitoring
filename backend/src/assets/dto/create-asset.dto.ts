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

import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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
  @ApiProperty({
    description: "Тип актива",
    enum: ["crypto", "nft"],
    example: "crypto",
  })
  @IsEnum(["crypto", "nft"])
  type!: "crypto" | "nft";

  /**
   * Количество актива.
   *
   * Должно быть числом.
   * @IsNumber() валидирует числовой тип.
   * @IsNotEmpty() гарантирует, что значение не пустое.
   */
  @ApiProperty({ description: "Количество актива", example: 1.5 })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  /**
   * Средняя цена актива.
   *
   * Должно быть числом.
   * @IsNumber() валидирует числовой тип.
   * @IsNotEmpty() гарантирует, что значение не пустое.
   */
  @ApiProperty({ description: "Средняя цена покупки", example: 45000 })
  @IsNumber()
  @IsNotEmpty()
  middlePrice!: number;

  /**
   * Символ актива (для crypto).
   *
   * Требуется для типа 'crypto'. Опционально для 'nft'.
   * @IsOptional() делает поле опциональным.
   * @IsString() проверяет, что значение является строкой.
   */
  @ApiPropertyOptional({
    description: "Символ криптовалюты (для crypto)",
    example: "BTC",
  })
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
  @ApiPropertyOptional({
    description: "Полное название (для crypto)",
    example: "Bitcoin",
  })
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
  @ApiPropertyOptional({
    description: "Текущая цена (для crypto)",
    example: 67000,
  })
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
  @ApiPropertyOptional({
    description: "Название коллекции NFT (slug)",
    example: "bored-ape-yacht-club",
  })
  @IsOptional()
  @IsString()
  collectionName?: string;

  /**
   * Символ нативного токена коллекции (для nft).
   *
   * Например: 'ETH', 'SOL', 'WETH', 'ATOM'.
   * По умолчанию 'ETH', если не указан.
   * @IsOptional() делает поле опциональным.
   * @IsString() проверяет, что значение является строкой.
   */
  @ApiPropertyOptional({
    description: "Нативный токен коллекции",
    example: "ETH",
  })
  @IsOptional()
  @IsString()
  nativeToken?: string;

  /**
   * Минимальная цена в коллекции (для nft).
   *
   * Требуется для типа 'nft'. Опционально для 'crypto'.
   * @IsOptional() делает поле опциональным.
   * @IsNumber() валидирует числовой тип.
   */
  @ApiPropertyOptional({ description: "Цена пола коллекции", example: 30.5 })
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
  @ApiPropertyOptional({ description: "Цена по признакам", example: 45.0 })
  @IsOptional()
  @IsNumber()
  traitPrice?: number;
}
