'use client';

import Link from 'next/link';
import { LayoutDashboard, UserCheck, Users, Layers, Video, CalendarClock } from 'lucide-react';
import { useOverviewQuery } from '@/store/api/adminApi';
import { useListClassesQuery } from '@/store/api/classApi';
import { errorMessage } from '@/store/api/baseApi';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatTile } from '@/components/ui/StatTile';
import { Table, type TableColumn } from '@/components/ui/Table';
import { formatClassTime } from '@/lib/format';
import type { AdminOverview } from '@/lib/types';

type RecentClass = AdminOverview['recentClasses'][number];

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useOverviewQuery();
  const live = useListClassesQuery({ status: 'live', limit: 10 });
  const liveClasses = live.data?.rows ?? [];

  if (isLoading) return <SkeletonOverview />;
  if (error || !data) {
    return (
      <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
        <p>{errorMessage(error)}</p>
        <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
      </div>
    );
  }

  const columns: TableColumn<RecentClass>[] = [
    { key: 'title', header: 'Class', render: (row) => <span className="font-medium text-text">{row.title}</span> },
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
    <div className="space-y-10">
      <PageHeader icon={LayoutDashboard} title="Overview" subtitle="Everything happening across your batches, at a glance." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Pending"
          value={data.pendingVerifications}
          tone={data.pendingVerifications > 0 ? 'rose' : 'default'}
          icon={UserCheck}
          href="/admin/users"
          style={{ '--stagger': 0 } as React.CSSProperties}
        />
        <StatTile
          label="Verified students"
          value={data.verifiedStudents}
          tone="emerald"
          icon={Users}
          style={{ '--stagger': 1 } as React.CSSProperties}
        />
        <StatTile
          label="Active batches"
          value={data.activeBatches}
          tone="violet"
          icon={Layers}
          style={{ '--stagger': 2 } as React.CSSProperties}
        />
        <StatTile
          label="Live classes"
          value={data.liveClasses}
          tone="brand"
          icon={Video}
          style={{ '--stagger': 3 } as React.CSSProperties}
        />
        <StatTile
          label="Upcoming classes"
          value={data.upcomingClasses}
          tone="teal"
          icon={CalendarClock}
          style={{ '--stagger': 4 } as React.CSSProperties}
        />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-text-subtle uppercase">
          Live now
        </h2>
        {liveClasses.length === 0 ? (
          <EmptyState title="No live classes" body="Classes that are running now will appear here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveClasses.map((cls, i) => (
              <Card key={cls._id} style={{ '--stagger': i } as React.CSSProperties}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-danger-600" />
                      </span>
                      <div className="font-medium text-text">{cls.title}</div>
                    </div>
                    <div className="mt-1 text-sm text-text-subtle">{formatClassTime(cls.scheduledStartAt)}</div>
                  </div>
                  <Link
                    href={`/admin/classes/${cls._id}`}
                    className="transition-ads rounded-sm bg-brand-600 px-3 py-1.5 text-sm font-medium text-white shadow-raised hover:bg-brand-700 hover:shadow-overlay active:scale-[0.97]"
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
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-text-subtle uppercase">
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
  );
}

function SkeletonOverview() {
  return (
    <div className="space-y-10">
      <div className="h-9 w-56 animate-pulse rounded bg-surface-sunken" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-surface-sunken" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-lg bg-surface-sunken" />
    </div>
  );
}
