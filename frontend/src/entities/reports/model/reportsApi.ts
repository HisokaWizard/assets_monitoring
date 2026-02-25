/**
 * @fileoverview RTK Query API для отчетов.
 *
 * Предоставляет endpoints для генерации отчетов.
 */

import { baseApi } from '../../../shared/api/base';
import { GenerateReportDto } from './types';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateReport: builder.mutation<string, GenerateReportDto>({
      query: (data) => ({
        url: '/notifications/reports/generate',
        method: 'POST',
        body: data,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGenerateReportMutation } = reportsApi;
