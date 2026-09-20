'use client';

import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminShell } from '@/components/AdminShell';
import { useOverviewQuery } from '@/store/api/adminApi';
import { useListClassesQuery } from '@/store/api/classApi';
import { errorMessage } from '@/store/api/baseApi';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatTile } from '@/components/ui/StatTile';
import { Table, type TableColumn } from '@/components/ui/Table';
import { formatClassTime } from '@/lib/format';
import type { AdminOverview } from '@/lib/types';

type RecentClass = AdminOverview['recentClasses'][number];

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useOverviewQuery();
  const live = useListClassesQuery({ status: 'live', limit: 10 });
  const liveClasses = live.data?.rows ?? [];

  if (isLoading) return <AdminShell><SkeletonOverview /></AdminShell>;
  if (error || !data) {
    return (
      <AdminShell>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{errorMessage(error)}</p>
          <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
        </div>
      </AdminShell>
    );
  }

  const columns: TableColumn<RecentClass>[] = [
    { key: 'title', header: 'Class', render: (row) => <span className="font-medium text-slate-900">{row.title}</span> },
    { key: 'batch', header: 'Batch', render: (row) => row.batch?.code },
    { key: 'started', header: 'Started', render: (row) => (row.actualStartAt ? formatClassTime(row.actualStartAt) : '—') },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (row) =>
        row.stats ? `${row.stats.presentCount} of ${row.stats.enrolledCount}` : '—',
    },
  ];

  return (
    <RequireAuth role="admin">
      <AdminShell>
        <div className="space-y-8">
          <h1 className="text-lg font-semibold text-slate-900">Overview</h1>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            <StatTile
              label="Pending"
              value={data.pendingVerifications}
              tone={data.pendingVerifications > 0 ? 'rose' : 'default'}
              href="/admin/users"
            />
            <StatTile label="Verified students" value={data.verifiedStudents} />
            <StatTile label="Active batches" value={data.activeBatches} />
            <StatTile label="Live classes" value={data.liveClasses} tone="brand" />
            <StatTile label="Upcoming classes" value={data.upcomingClasses} />
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Live now
            </h2>
            {liveClasses.length === 0 ? (
              <EmptyState title="No live classes" body="Classes that are running now will appear here." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {liveClasses.map((cls) => (
                  <Card key={cls._id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{cls.title}</div>
                        <div className="text-sm text-slate-500">{formatClassTime(cls.scheduledStartAt)}</div>
                      </div>
                      <Link
                        href={`/admin/classes/${cls._id}`}
                        className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                      >
                        Open panel
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Recent classes
            </h2>
            <Card>
              <Table
                columns={columns}
                rows={data.recentClasses}
                empty={
                  <EmptyState
                    title="No finished classes"
                    body="Classes you run and end will appear here with their attendance."
                  />
                }
              />
            </Card>
          </section>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}

function SkeletonOverview() {
  return (
    <div className="space-y-8">
      <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-lg bg-slate-200" />
    </div>
  );
}
