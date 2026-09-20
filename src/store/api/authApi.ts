import { baseApi, unwrap } from '@/store/api/baseApi';
import type { CurrentUser, LoginPayload, RegisterPayload } from '@/lib/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Returns the created (still `pending`) user. Does NOT sign them in. */
    register: build.mutation<CurrentUser, RegisterPayload>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      transformResponse: unwrap<CurrentUser>,
    }),

    login: build.mutation<CurrentUser, LoginPayload>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: unwrap<CurrentUser>,
      // Everything the signed-out shell cached is now wrong.
      invalidatesTags: ['User', 'Batch', 'Class', 'Attendance', 'Admin'],
    }),

    logout: build.mutation<null, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      transformResponse: unwrap<null>,
      invalidatesTags: ['User', 'Batch', 'Class', 'Attendance', 'Admin'],
    }),

    /** The session probe. Every protected layout calls this on mount. */
    me: build.query<CurrentUser, void>({
      query: () => '/auth/me',
      transformResponse: unwrap<CurrentUser>,
      providesTags: ['User'],
    }),

    changePassword: build.mutation<null, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/password', method: 'PATCH', body }),
      transformResponse: unwrap<null>,
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useChangePasswordMutation,
} = authApi;
