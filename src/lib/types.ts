/**
 * Mirrors the server's response shapes. When the API changes, change this file
 * first — every hook and page is typed off it.
 *
 * Source of truth: ../../learnlive-serverside/docs/API_SPEC.md
 */

export type UserRole = 'student' | 'admin';
export type UserStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type ClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type AttendanceStatus = 'present' | 'partial' | 'absent';

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** The envelope every endpoint returns. `baseApi` unwraps it for you. */
export interface ApiEnvelope<T> {
  success: true;
  message?: string;
  meta?: ApiMeta;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  code: string;
  details?: Array<{ field: string; message: string }>;
}

export interface Paginated<T> {
  rows: T[];
  meta: ApiMeta;
}

/* ------------------------------- auth ---------------------------------- */

/**
 * Not one consistent wire shape. `/auth/*` builds this through the server's
 * `toPublicUser`, which normalises to `id`. Everywhere else it comes from a
 * raw `.populate('batch', 'code title').lean()`, which carries Mongoose's
 * `_id` instead. Read with `batch.id ?? batch._id`, never `batch.id` alone.
 */
export interface BatchRef {
  id?: string;
  _id?: string;
  code: string;
  title: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  batch: BatchRef | null;
  createdAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  batchCode: string;
}

export interface LoginPayload {
  /** Email or phone — the server accepts either. */
  identifier: string;
  password: string;
}

/* ------------------------------ batches -------------------------------- */

export interface Batch {
  _id: string;
  code: string;
  title: string;
  description: string | null;
  status: 'active' | 'archived';
  startDate: string | null;
  endDate: string | null;
  studentCount?: number;
  upcomingClassCount?: number;
  createdAt: string;
}

export interface BatchStudent {
  id: string;
  name: string;
  /** Admins only. */
  email?: string;
  phone?: string;
  status?: UserStatus;
  createdAt?: string;
}

/* ------------------------------ classes -------------------------------- */

export interface ClassSession {
  _id: string;
  batch: BatchRef | string;
  title: string;
  description: string | null;
  scheduledStartAt: string;
  scheduledDurationMin: number;
  status: ClassStatus;
  actualStartAt: string | null;
  actualEndAt: string | null;
  roomName: string;
  attendanceThresholdPct: number;
  stats: ClassStats | null;
  createdAt: string;
}

export interface ClassStats {
  enrolledCount: number;
  joinedCount: number;
  presentCount: number;
  avgPresencePct: number;
}

/** What `POST /classes/:id/join` hands back. Feed it straight to LiveKit. */
export interface JoinGrant {
  token: string;
  wsUrl: string;
  roomName: string;
  isHost: boolean;
  classSession: {
    id: string;
    title: string;
    startedAt: string | null;
    scheduledDurationMin: number;
    attendanceThresholdPct: number;
  };
}

export interface EndClassResult {
  classSessionId: string;
  durationMs: number;
  enrolledCount: number;
  joinedCount: number;
  presentCount: number;
  avgPresencePct: number;
  alreadyFinalized: boolean;
}

/* ---------------------------- attendance ------------------------------- */

export interface LivePresenceRow {
  studentId: string;
  name: string;
  email: string;
  inRoom: boolean;
  totalPresentMs: number;
  presencePct: number;
  projectedStatus: AttendanceStatus;
  lastHeartbeatAt: string | null;
}

export interface LiveAttendance {
  elapsedMs: number;
  rows: LivePresenceRow[];
}

export interface AttendanceSheetRow {
  id: string;
  student: { id: string; name: string; email: string; phone: string };
  totalPresentMs: number;
  presencePct: number;
  status: AttendanceStatus;
  firstJoinedAt: string | null;
  lastLeftAt: string | null;
  segmentCount: number;
  overridden: boolean;
}

export interface AttendanceSheet {
  classSession: {
    id: string;
    title: string;
    actualStartAt: string | null;
    actualEndAt: string | null;
    durationMs: number;
    attendanceThresholdPct: number;
    status: ClassStatus;
  };
  rows: AttendanceSheetRow[];
  summary: {
    enrolled: number;
    joined: number;
    present: number;
    partial: number;
    absent: number;
    avgPresencePct: number;
  };
}

export interface MyAttendanceRow {
  id: string;
  classSession: {
    id: string;
    title: string;
    scheduledStartAt: string;
    actualStartAt: string | null;
    actualEndAt: string | null;
    status: ClassStatus;
    attendanceThresholdPct: number;
  };
  totalPresentMs: number;
  presencePct: number;
  status: AttendanceStatus;
}

export interface MyAttendance {
  rows: MyAttendanceRow[];
  meta: ApiMeta;
  overall: { totalClasses: number; attended: number; attendanceRate: number };
}

/* ------------------------------ analytics ------------------------------ */

export interface BatchAnalytics {
  perStudent: Array<{
    studentId: string;
    name: string;
    email: string;
    classesHeld: number;
    attended: number;
    attendanceRate: number;
    avgPresencePct: number;
  }>;
  perClass: Array<{
    classId: string;
    title: string;
    date: string;
    durationMin: number;
    enrolled: number;
    present: number;
    attendanceRate: number;
    /** The bar that class actually used — admins can set a different one per class. */
    attendanceThresholdPct: number;
  }>;
  summary: { totalClasses: number; totalStudents: number; overallAttendanceRate: number };
}

export interface AdminOverview {
  pendingVerifications: number;
  verifiedStudents: number;
  activeBatches: number;
  liveClasses: number;
  upcomingClasses: number;
  recentClasses: Array<{
    _id: string;
    title: string;
    batch: { code: string };
    actualStartAt: string | null;
    actualEndAt: string | null;
    stats: ClassStats | null;
  }>;
}

export interface PendingUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  batch: BatchRef | null;
  requestedBatchCode: string | null;
  rejectionReason: string | null;
  createdAt: string;
}
