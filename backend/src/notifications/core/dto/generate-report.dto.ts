/**
 * @fileoverview DTO для генерации отчета.
 *
 * Этот файл определяет структуру данных для запроса генерации отчета.
 * Включает тип отчета и период.
 */

import { IsOptional, IsString, IsIn } from 'class-validator';

/**
 * DTO для генерации отчета.
 *
 * Определяет параметры для ручной генерации отчета по портфелю.
 */
export class GenerateReportDto {
  /**
   * Тип отчета (опционально, по умолчанию для активов с изменениями).
   */
  @IsOptional()
  @IsString()
  @IsIn(['changes', 'full'])
  type?: string;

  /**
   * Период отчета.
   */
  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  period?: string;
}
