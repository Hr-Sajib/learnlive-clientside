import { baseApi, unwrap } from '@/store/api/baseApi';
import type { AttendanceSheet, AttendanceStatus, MyAttendance } from '@/lib/types';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** The signed-in student's own history, plus an `overall` summary. */
    myAttendance: build.query<MyAttendance, { page?: number; limit?: number } | void>({
      query: (args) => ({ url: '/attendance/me', params: args ?? undefined }),
      // This endpoint returns `overall` alongside the envelope's data + meta, so
      // it is assembled by hand rather than through `unwrapWithMeta`.
      transformResponse: (response: MyAttendance & { data: MyAttendance['rows'] }) => ({
        rows: response.data,
        meta: response.meta,
        overall: response.overall,
      }),
      providesTags: ['Attendance'],
    }),

    classAttendance: build.query<AttendanceSheet, string>({
      query: (id) => `/classes/${id}/attendance`,
      transformResponse: unwrap<AttendanceSheet>,
      providesTags: (_r, _e, id) => ['Attendance', { type: 'Attendance' as const, id }],
    }),

    overrideAttendance: build.mutation<
      unknown,
      { id: string; status: AttendanceStatus; reason: string }
    >({
      query: ({ id, ...body }) => ({ url: `/attendance/${id}/override`, method: 'PATCH', body }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

export const { useMyAttendanceQuery, useClassAttendanceQuery, useOverrideAttendanceMutation } =
  attendanceApi;
