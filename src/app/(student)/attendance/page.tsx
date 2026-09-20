'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { useMyAttendanceQuery } from '@/store/api/attendanceApi';
import { errorMessage } from '@/store/api/baseApi';
import type { AttendanceStatus, MyAttendanceRow } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, type TableColumn } from '@/components/ui/Table';
import { formatClassTime, formatDuration, formatPercent, attendanceTone } from '@/lib/format';

const badgeTone: Record<AttendanceStatus, 'green' | 'amber' | 'red'> = {
  present: 'green',
  partial: 'amber',
  absent: 'red',
};

export default function MyAttendancePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useMyAttendanceQuery({ page, limit: 20 });

  const rows = data?.rows ?? [];
  const meta = data?.meta;
  const overall = data?.overall;

  const columns: TableColumn<MyAttendanceRow>[] = [
    {
      key: 'title',
      header: 'Class',
      render: (row) => <span className="font-medium text-text">{row.classSession.title}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatClassTime(row.classSession.scheduledStartAt),
    },
    {
      key: 'time',
      header: 'Time present',
      render: (row) => formatDuration(row.totalPresentMs),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge tone={badgeTone[row.status]}>{attendanceTone[row.status].label}</Badge>
          <span className="tabular-nums text-text">
            {formatPercent(row.presencePct)}
            {row.status !== 'present' && (
              // "54% (60% needed)" reads as a fact the student can check;
              // a bare "Absent" reads as an accusation with nothing to verify it against.
              <span className="text-text-subtlest"> ({row.classSession.attendanceThresholdPct}% needed)</span>
            )}
          </span>
        </div>
      ),
    },
  ];

  return (
        <div className="space-y-6">
          <PageHeader icon={ClipboardCheck} title="My attendance" subtitle="Your record across every class you've joined." />

          {overall && (
            <p className="text-sm text-text-subtle">
              You attended{' '}
              <span className="font-semibold text-text">{overall.attended}</span> of{' '}
              <span className="font-semibold text-text">{overall.totalClasses}</span> classes
              ({formatPercent(overall.attendanceRate)})
            </p>
          )}

          {isLoading ? (
            <SkeletonTable />
          ) : error ? (
            <ListError message={errorMessage(error)} onRetry={refetch} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No attendance yet"
              body="Once you join a class and it ends, your attendance will appear here."
            />
          ) : (
            <Card>
              <Table columns={columns} rows={rows} />
            </Card>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-text-subtle">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg border border-border bg-surface-sunken" />
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
