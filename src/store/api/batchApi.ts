import { baseApi, unwrap, unwrapWithMeta } from '@/store/api/baseApi';
import type { ApiMeta, Batch, BatchAnalytics, BatchStudent } from '@/lib/types';

export const batchApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listBatches: build.query<
      { rows: Batch[]; meta: ApiMeta },
      { page?: number; limit?: number; status?: 'active' | 'archived'; search?: string } | void
    >({
      query: (args) => ({ url: '/batches', params: args ?? undefined }),
      transformResponse: unwrapWithMeta<Batch>,
      providesTags: ['Batch'],
    }),

    getBatch: build.query<Batch, string>({
      query: (id) => `/batches/${id}`,
      transformResponse: unwrap<Batch>,
      providesTags: (_r, _e, id) => [{ type: 'Batch' as const, id }],
    }),

    createBatch: build.mutation<
      Batch,
      { code: string; title: string; description?: string | null; startDate?: string | null; endDate?: string | null }
    >({
      query: (body) => ({ url: '/batches', method: 'POST', body }),
      transformResponse: unwrap<Batch>,
      invalidatesTags: ['Batch', 'Admin'],
    }),

    updateBatch: build.mutation<Batch, { id: string; body: Partial<Batch> }>({
      query: ({ id, body }) => ({ url: `/batches/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap<Batch>,
      invalidatesTags: (_r, _e, { id }) => ['Batch', { type: 'Batch' as const, id }],
    }),

    /** Students get `{ id, name }` only; admins get contact details and status. */
    listBatchStudents: build.query<BatchStudent[], string>({
      query: (id) => `/batches/${id}/students`,
      transformResponse: unwrap<BatchStudent[]>,
      providesTags: ['Batch', 'User'],
    }),

    batchAnalytics: build.query<BatchAnalytics, { id: string; from?: string; to?: string }>({
      query: ({ id, ...params }) => ({ url: `/batches/${id}/analytics`, params }),
      transformResponse: unwrap<BatchAnalytics>,
      providesTags: ['Attendance'],
    }),
  }),
});

export const {
  useListBatchesQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useListBatchStudentsQuery,
  useBatchAnalyticsQuery,
} = batchApi;
