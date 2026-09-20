'use client';

import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { StudentShell } from '@/components/StudentShell';
import { useListClassesQuery } from '@/store/api/classApi';
import { useMyAttendanceQuery } from '@/store/api/attendanceApi';
import { errorMessage } from '@/store/api/baseApi';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatClassTime, formatDuration, formatPercent, classStatusTone } from '@/lib/format';

export default function StudentDashboardPage() {
  const live = useListClassesQuery({ status: 'live', limit: 1 });
  const upcoming = useListClassesQuery({ status: 'scheduled', limit: 5 });
  const attendance = useMyAttendanceQuery({ limit: 1 });

  const liveClass = live.data?.rows?.[0];
  const upcomingRows = upcoming.data?.rows ?? [];
  const overall = attendance.data?.overall;

  return (
    <RequireAuth role="student">
      <StudentShell>
        <div className="space-y-8">
          {liveClass && (
            <div className="rounded-lg bg-brand-600 p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-brand-100">
                    Live now
                  </div>
                  <h2 className="mt-1 text-xl font-semibold">{liveClass.title}</h2>
                </div>
                <Link
                  href={`/classes/${liveClass._id}/room`}
                  className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  Join class
                </Link>
              </div>
            </div>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-70">
              Next up
            </h3>
            {upcoming.isLoading ? (
              <SkeletonRows count={3} />
            ) : upcoming.error ? (
              <ListError message={errorMessage(upcoming.error)} onRetry={upcoming.refetch} />
            ) : upcomingRows.length === 0 ? (
              <EmptyState
                title="Nothing scheduled"
                body="Your coach hasn't scheduled any classes yet. Check back soon."
              />
            ) : (
              <Card>
                <ul className="divide-y divide-slate-100">
                  {upcomingRows.map((cls) => (
                    <li key={cls._id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <div className="font-medium text-neutral-100">{cls.title}</div>
                        <div className="text-sm text-neutral-70">
                          {formatClassTime(cls.scheduledStartAt)} ·{' '}
                          {formatDuration(cls.scheduledDurationMin * 60_000)}
                        </div>
                      </div>
                      <Badge tone="slate">{classStatusTone.scheduled.label}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-70">
              Your attendance
            </h3>
            {attendance.isLoading ? (
              <SkeletonRows count={1} />
            ) : attendance.error ? (
              <ListError message={errorMessage(attendance.error)} onRetry={attendance.refetch} />
            ) : overall && overall.totalClasses > 0 ? (
              <Card>
                <p className="text-sm text-neutral-80">
                  You attended{' '}
                  <span className="font-semibold text-neutral-100">{overall.attended}</span> of{' '}
                  <span className="font-semibold text-neutral-100">{overall.totalClasses}</span>{' '}
                  classes ({formatPercent(overall.attendanceRate)})
                </p>
                <div className="mt-3">
                  <ProgressBar value={overall.attendanceRate} tone="green" />
                </div>
              </Card>
            ) : (
              <EmptyState
                title="No attendance yet"
                body="Once a class ends, your attendance will show up here."
              />
            )}
          </section>
        </div>
      </StudentShell>
    </RequireAuth>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border border-neutral-30 bg-neutral-20" />
      ))}
    </div>
  );
}

function ListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
      <p>{message}</p>
      <button onClick={onRetry} className="mt-2 font-medium underline">
        Try again
      </button>
    </div>
  );
}
