'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminShell } from '@/components/AdminShell';
import { useEndClassMutation, useGetClassQuery, useLiveAttendanceQuery } from '@/store/api/classApi';
import { useClassAttendanceQuery, useOverrideAttendanceMutation } from '@/store/api/attendanceApi';
import { errorMessage } from '@/store/api/baseApi';
import { overrideAttendanceSchema } from '@/lib/validation';
import { attendanceTone, classStatusTone, formatDuration, formatPercent } from '@/lib/format';
import type { AttendanceSheetRow, AttendanceStatus, ClassSession, LivePresenceRow } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { StatTile } from '@/components/ui/StatTile';
import { Table, type TableColumn } from '@/components/ui/Table';

const badgeTone: Record<AttendanceStatus, 'green' | 'amber' | 'red'> = {
  present: 'green',
  partial: 'amber',
  absent: 'red',
};

export default function AdminClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cls, isLoading, error, refetch } = useGetClassQuery(id);

  if (isLoading) {
    return (
      <RequireAuth role="admin">
        <AdminShell>
          <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
        </AdminShell>
      </RequireAuth>
    );
  }

  if (error || !cls) {
    return (
      <RequireAuth role="admin">
        <AdminShell>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p>{errorMessage(error)}</p>
            <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
          </div>
        </AdminShell>
      </RequireAuth>
    );
  }

  if (cls.status === 'live') return <LivePanel cls={cls} />;
  if (cls.status === 'ended') return <AttendanceSheet cls={cls} />;

  return (
    <RequireAuth role="admin">
      <AdminShell>
        <Card title={cls.title}>
          <p className="text-sm text-slate-500">
            This class is {cls.status === 'scheduled' ? 'scheduled' : 'cancelled'} and has not run yet.
          </p>
        </Card>
      </AdminShell>
    </RequireAuth>
  );
}

function LivePanel({ cls }: { cls: ClassSession }) {
  const { data, isLoading, error, refetch } = useLiveAttendanceQuery(cls._id, { pollingInterval: 10_000 });
  const [endClass] = useEndClassMutation();
  const [confirmEnd, setConfirmEnd] = useState(false);

  const rows = [...(data?.rows ?? [])].sort((a, b) => b.presencePct - a.presencePct);
  const inRoom = rows.filter((r) => r.inRoom).length;

  const columns: TableColumn<LivePresenceRow>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${row.inRoom ? 'bg-emerald-500' : 'bg-slate-300'}`}
            aria-hidden="true"
          />
          <div>
            <div className="font-medium text-slate-900">{row.name}</div>
            <div className="text-xs text-slate-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'inRoom', header: 'In room', render: (row) => (row.inRoom ? 'Yes' : 'No') },
    { key: 'present', header: 'Present', render: (row) => formatDuration(row.totalPresentMs) },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => (
        <div className="w-32">
          <ProgressBar value={row.presencePct} threshold={cls.attendanceThresholdPct} tone={badgeTone[row.projectedStatus]} />
        </div>
      ),
    },
    {
      key: 'projected',
      header: 'Projected',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge tone={badgeTone[row.projectedStatus]}>{attendanceTone[row.projectedStatus].label}</Badge>
          <span className="tabular-nums text-slate-600">{formatPercent(row.presencePct)}</span>
        </div>
      ),
    },
  ];

  return (
    <RequireAuth role="admin">
      <AdminShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                <Badge tone="red">{classStatusTone.live.label}</Badge>
                {data && <span className="tabular-nums text-sm text-slate-500">{formatDuration(data.elapsedMs)}</span>}
              </div>
              <h1 className="mt-1 text-lg font-semibold text-slate-900">{cls.title}</h1>
              <p className="text-sm text-slate-500">
                {inRoom} of {rows.length} in the room
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => window.open(`/classes/${cls._id}/room`, '_blank', 'noopener,noreferrer')}
              >
                Join as host
              </Button>
              <Button variant="danger" onClick={() => setConfirmEnd(true)}>
                End class
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{errorMessage(error)}</p>
              <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No students yet" body="Verified students appear here as they join the room." />
          ) : (
            <Card>
              <Table columns={columns} rows={rows} />
            </Card>
          )}
        </div>

        <ConfirmDialog
          open={confirmEnd}
          title="End class"
          body="Ending the class finalises everyone's attendance and closes the room. This cannot be undone."
          confirmLabel="End class"
          tone="danger"
          onClose={() => setConfirmEnd(false)}
          onConfirm={async () => {
            try {
              const result = await endClass(cls._id).unwrap();
              toast.success(
                `Class ended. ${result.presentCount} of ${result.enrolledCount} students met the attendance threshold.`,
              );
              setConfirmEnd(false);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />
      </AdminShell>
    </RequireAuth>
  );
}

function AttendanceSheet({ cls }: { cls: ClassSession }) {
  const { data, isLoading, error, refetch } = useClassAttendanceQuery(cls._id);
  const [overrideTarget, setOverrideTarget] = useState<AttendanceSheetRow | null>(null);
  const [override] = useOverrideAttendanceMutation();

  const rows = data?.rows ?? [];
  const summary = data?.summary;

  const columns: TableColumn<AttendanceSheetRow>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.student.name}</div>
          <div className="text-xs text-slate-500">{row.student.email}</div>
        </div>
      ),
    },
    { key: 'time', header: 'Time present', render: (row) => formatDuration(row.totalPresentMs) },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Badge tone={badgeTone[row.status]}>{attendanceTone[row.status].label}</Badge>
          <span className={`tabular-nums ${row.overridden ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
            {formatPercent(row.presencePct)}
          </span>
          {row.overridden && <span className="text-xs text-slate-500">override</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end">
          <Button size="sm" variant="secondary" onClick={() => setOverrideTarget(row)}>
            Override
          </Button>
        </div>
      ),
    },
  ];

  return (
    <RequireAuth role="admin">
      <AdminShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{cls.title}</h1>
              <p className="text-sm text-slate-500">Attendance sheet</p>
            </div>
            <Button variant="secondary" onClick={() => exportCsv(rows)}>
              Export CSV
            </Button>
          </div>

          {summary && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
              <StatTile label="Enrolled" value={summary.enrolled} />
              <StatTile label="Joined" value={summary.joined} />
              <StatTile label="Present" value={summary.present} tone="emerald" />
              <StatTile label="Partial" value={summary.partial} tone="amber" />
              <StatTile label="Absent" value={summary.absent} tone="rose" />
              <StatTile label="Avg presence" value={formatPercent(summary.avgPresencePct)} />
            </div>
          )}

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-slate-200" />
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{errorMessage(error)}</p>
              <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No attendance rows" body="Attendance appears here once the class has ended." />
          ) : (
            <Card>
              <Table columns={columns} rows={rows} />
            </Card>
          )}
        </div>

        <OverrideDialog
          row={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onConfirm={async (values) => {
            if (!overrideTarget) return;
            try {
              await override({ id: overrideTarget.id, status: values.status, reason: values.reason }).unwrap();
              toast.success('Attendance updated.');
              setOverrideTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />
      </AdminShell>
    </RequireAuth>
  );
}

function OverrideDialog({
  row,
  onClose,
  onConfirm,
}: {
  row: AttendanceSheetRow | null;
  onClose: () => void;
  onConfirm: (values: { status: AttendanceStatus; reason: string }) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ status: AttendanceStatus; reason: string }>({
    resolver: zodResolver(overrideAttendanceSchema),
  });

  useEffect(() => {
    if (row) reset({ status: row.status, reason: '' });
  }, [row, reset]);

  return (
    <Modal open={!!row} onClose={onClose} title="Override attendance">
      {row && (
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4">
          <p className="text-sm text-slate-600">
            Overriding <span className="font-medium text-slate-900">{row.student.name}</span> (computed{' '}
            {formatPercent(row.presencePct)}). The computed value is kept for the record.
          </p>
          <Select
            label="Status"
            options={[
              { value: 'present', label: 'Present' },
              { value: 'partial', label: 'Partial' },
              { value: 'absent', label: 'Absent' },
            ]}
            error={errors.status?.message}
            {...register('status')}
          />
          <Input label="Reason" error={errors.reason?.message} {...register('reason')} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Override</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function exportCsv(rows: AttendanceSheetRow[]) {
  const header = ['Name', 'Email', 'Phone', 'Time present (ms)', 'Presence %', 'Status'];
  const lines = rows.map((row) => [
    row.student.name,
    row.student.email,
    row.student.phone,
    String(row.totalPresentMs),
    String(row.presencePct),
    row.status,
  ]);

  const csv = [header, ...lines]
    .map((cells) => cells.map(escapeCsv).join(','))
    .join('\n');

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'attendance.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
