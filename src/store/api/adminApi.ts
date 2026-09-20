import { baseApi, unwrap, unwrapWithMeta } from '@/store/api/baseApi';
import type { AdminOverview, ApiMeta, PendingUser, UserStatus } from '@/lib/types';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    overview: build.query<AdminOverview, void>({
      query: () => '/admin/overview',
      transformResponse: unwrap<AdminOverview>,
      providesTags: ['Admin'],
    }),

    /** The approval queue. Defaults to `pending` server-side. */
    listUsers: build.query<
      { rows: PendingUser[]; meta: ApiMeta },
      { page?: number; limit?: number; status?: UserStatus; batchId?: string; search?: string } | void
    >({
      query: (args) => ({ url: '/admin/users', params: args ?? undefined }),
      transformResponse: unwrapWithMeta<PendingUser>,
      providesTags: ['User'],
    }),

    /** `batchId` is optional — pass it to place the student in a different batch. */
    verifyUser: build.mutation<PendingUser, { id: string; batchId?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}/verify`, method: 'PATCH', body }),
      transformResponse: unwrap<PendingUser>,
      invalidatesTags: ['User', 'Admin', 'Batch'],
    }),

    rejectUser: build.mutation<PendingUser, { id: string; reason: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}/reject`, method: 'PATCH', body }),
      transformResponse: unwrap<PendingUser>,
      invalidatesTags: ['User', 'Admin'],
    }),

    suspendUser: build.mutation<PendingUser, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/users/${id}/suspend`, method: 'PATCH', body }),
      transformResponse: unwrap<PendingUser>,
      invalidatesTags: ['User', 'Admin', 'Batch'],
    }),

    createAdmin: build.mutation<
      PendingUser,
      { name: string; email: string; phone: string; password: string }
    >({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      transformResponse: unwrap<PendingUser>,
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useOverviewQuery,
  useListUsersQuery,
  useVerifyUserMutation,
  useRejectUserMutation,
  useSuspendUserMutation,
  useCreateAdminMutation,
} = adminApi;
