'use client';

import Link from 'next/link';
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
        <div className="space-y-10">
          {liveClass && (
            <div
              className="animate-rise-in relative overflow-hidden rounded-lg p-7 text-white shadow-overlay"
              style={{ background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-violet-600))' }}
            >
              <div
                className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10"
                aria-hidden="true"
              />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white/80 uppercase">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                    </span>
                    Live now
                  </div>
                  <h2 className="mt-1.5 text-2xl font-semibold">{liveClass.title}</h2>
                </div>
                <Link
                  href={`/classes/${liveClass._id}/room`}
                  className="transition-ads inline-flex items-center justify-center rounded-sm bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-raised hover:shadow-overlay active:scale-[0.97]"
                >
                  Join class
                </Link>
              </div>
            </div>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-text-subtle uppercase">
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
                <ul className="divide-y divide-border">
                  {upcomingRows.map((cls) => (
                    <li key={cls._id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <div className="font-medium text-text">{cls.title}</div>
                        <div className="text-sm text-text-subtle">
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
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-text-subtle uppercase">
              Your attendance
            </h3>
            {attendance.isLoading ? (
              <SkeletonRows count={1} />
            ) : attendance.error ? (
              <ListError message={errorMessage(attendance.error)} onRetry={attendance.refetch} />
            ) : overall && overall.totalClasses > 0 ? (
              <Card>
                <p className="text-sm text-text-subtle">
                  You attended{' '}
                  <span className="font-semibold text-text">{overall.attended}</span> of{' '}
                  <span className="font-semibold text-text">{overall.totalClasses}</span>{' '}
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
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-surface-sunken" />
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
