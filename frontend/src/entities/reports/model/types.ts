/**
 * @fileoverview Типы для отчетов.
 */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface GenerateReportDto {
  type?: 'changes' | 'full';
  period?: ReportPeriod;
}
