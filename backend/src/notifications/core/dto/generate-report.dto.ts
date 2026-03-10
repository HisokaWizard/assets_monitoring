/**
 * @fileoverview DTO для генерации отчета.
 *
 * Этот файл определяет структуру данных для запроса генерации отчета.
 * Включает тип отчета и период.
 */

import { IsOptional, IsString, IsIn } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO для генерации отчета.
 *
 * Определяет параметры для ручной генерации отчета по портфелю.
 */
export class GenerateReportDto {
  /**
   * Тип отчета (опционально, по умолчанию для активов с изменениями).
   */
  @ApiPropertyOptional({
    description: "Тип отчёта",
    enum: ["changes", "full"],
    example: "changes",
  })
  @IsOptional()
  @IsString()
  @IsIn(["changes", "full"])
  type?: string;

  /**
   * Период отчета.
   */
  @ApiPropertyOptional({
    description: "Период отчёта",
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    example: "weekly",
  })
  @IsOptional()
  @IsString()
  @IsIn(["daily", "weekly", "monthly", "quarterly", "yearly"])
  period?: string;
}
