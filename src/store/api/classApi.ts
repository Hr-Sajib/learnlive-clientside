import { baseApi, unwrap, unwrapWithMeta } from '@/store/api/baseApi';
import type {
  ApiMeta,
  ClassSession,
  ClassStatus,
  EndClassResult,
  JoinGrant,
  LiveAttendance,
} from '@/lib/types';

interface ListClassesArgs {
  page?: number;
  limit?: number;
  batchId?: string;
  status?: ClassStatus;
}

export const classApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listClasses: build.query<{ rows: ClassSession[]; meta: ApiMeta }, ListClassesArgs | void>({
      query: (args) => ({ url: '/classes', params: args ?? undefined }),
      transformResponse: unwrapWithMeta<ClassSession>,
      providesTags: ['Class'],
    }),

    getClass: build.query<ClassSession, string>({
      query: (id) => `/classes/${id}`,
      transformResponse: unwrap<ClassSession>,
      providesTags: (_r, _e, id) => [{ type: 'Class' as const, id }],
    }),

    createClass: build.mutation<
      ClassSession,
      {
        batchId: string;
        title: string;
        description?: string | null;
        scheduledStartAt: string;
        scheduledDurationMin: number;
        attendanceThresholdPct?: number;
      }
    >({
      query: (body) => ({ url: '/classes', method: 'POST', body }),
      transformResponse: unwrap<ClassSession>,
      invalidatesTags: ['Class'],
    }),

    updateClass: build.mutation<ClassSession, { id: string; body: Partial<ClassSession> }>({
      query: ({ id, body }) => ({ url: `/classes/${id}`, method: 'PATCH', body }),
      transformResponse: unwrap<ClassSession>,
      invalidatesTags: (_r, _e, { id }) => ['Class', { type: 'Class' as const, id }],
    }),

    startClass: build.mutation<ClassSession, string>({
      query: (id) => ({ url: `/classes/${id}/start`, method: 'POST' }),
      transformResponse: unwrap<ClassSession>,
      invalidatesTags: (_r, _e, id) => ['Class', { type: 'Class' as const, id }],
    }),

    endClass: build.mutation<EndClassResult, string>({
      query: (id) => ({ url: `/classes/${id}/end`, method: 'POST' }),
      transformResponse: unwrap<EndClassResult>,
      // Ending a class writes everyone's attendance, so the sheets are stale.
      invalidatesTags: ['Class', 'Attendance', 'LiveAttendance', 'Admin'],
    }),

    cancelClass: build.mutation<ClassSession, string>({
      query: (id) => ({ url: `/classes/${id}/cancel`, method: 'POST' }),
      transformResponse: unwrap<ClassSession>,
      invalidatesTags: ['Class'],
    }),

    /**
     * Mints a LiveKit credential. A mutation, not a query, deliberately: it has
     * a server-side effect and its result must never be served from cache —
     * a stale token points at a room that has already closed.
     */
    joinClass: build.mutation<JoinGrant, string>({
      query: (id) => ({ url: `/classes/${id}/join`, method: 'POST' }),
      transformResponse: unwrap<JoinGrant>,
    }),

    /** Display-only presence ping. See LiveRoom.tsx. */
    heartbeat: build.mutation<{ acknowledged: boolean; classStatus: ClassStatus }, string>({
      query: (id) => ({ url: `/classes/${id}/heartbeat`, method: 'POST' }),
      transformResponse: unwrap<{ acknowledged: boolean; classStatus: ClassStatus }>,
    }),

    /** The admin live panel polls this. See `pollingInterval` at the call site. */
    liveAttendance: build.query<LiveAttendance, string>({
      query: (id) => `/classes/${id}/live-attendance`,
      transformResponse: unwrap<LiveAttendance>,
      providesTags: ['LiveAttendance'],
    }),

    recomputeAttendance: build.mutation<EndClassResult, string>({
      query: (id) => ({ url: `/classes/${id}/recompute`, method: 'POST' }),
      transformResponse: unwrap<EndClassResult>,
      invalidatesTags: ['Attendance', 'Class'],
    }),
  }),
});

export const {
  useListClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useStartClassMutation,
  useEndClassMutation,
  useCancelClassMutation,
  useJoinClassMutation,
  useHeartbeatMutation,
  useLiveAttendanceQuery,
  useRecomputeAttendanceMutation,
} = classApi;
