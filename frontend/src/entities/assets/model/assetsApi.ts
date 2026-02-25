/**
 * @fileoverview RTK Query API для активов.
 *
 * Предоставляет endpoints для управления активами пользователя.
 */

import { baseApi } from '../../../shared/api/base';
import { CryptoAsset, NFTAsset, CreateAssetDto, UpdateAssetDto } from './types';

export type AssetUnion = CryptoAsset | NFTAsset;

/**
 * API для активов.
 *
 * Endpoints:
 * - getAssets: GET /assets
 * - getAsset: GET /assets/:id
 * - createAsset: POST /assets
 * - updateAsset: PUT /assets/:id
 * - deleteAsset: DELETE /assets/:id
 * - refreshAssets: POST /assets/refresh
 */
export const assetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<AssetUnion[], void>({
      query: () => ({
        url: '/assets',
        method: 'GET',
      }),
      providesTags: ['Assets'],
    }),

    getAsset: builder.query<AssetUnion, number>({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => {
        return [{ type: 'Assets', id }];
      },
    }),

    createAsset: builder.mutation<AssetUnion, CreateAssetDto>({
      query: (data) => ({
        url: '/assets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Assets'],
    }),

    updateAsset: builder.mutation<AssetUnion, { id: number; data: UpdateAssetDto }>({
      query: ({ id, data }) => ({
        url: `/assets/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: () => ['Assets'],
    }),

    deleteAsset: builder.mutation<void, number>({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Assets'],
    }),

    refreshAssets: builder.mutation<AssetUnion[], void>({
      query: () => ({
        url: '/assets/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Assets'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAssetsQuery,
  useGetAssetQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useRefreshAssetsMutation,
} = assetsApi;
