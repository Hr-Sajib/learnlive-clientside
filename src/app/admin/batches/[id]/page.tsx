'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminShell } from '@/components/AdminShell';
import { useBatchAnalyticsQuery, useGetBatchQuery, useListBatchStudentsQuery } from '@/store/api/batchApi';
import { useCreateClassMutation, useListClassesQuery } from '@/store/api/classApi';
import { errorMessage } from '@/store/api/baseApi';
import { createClassSchema, type CreateClassValues } from '@/lib/validation';
import { classStatusTone, formatClassTime, formatDuration, formatPercent, relativeTime } from '@/lib/format';
import type { BatchAnalytics, BatchStudent, ClassSession, ClassStatus, UserStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatTile } from '@/components/ui/StatTile';
import { Table, type TableColumn } from '@/components/ui/Table';

/**
 * `perStudent` rolls up attendance across every class a student has taken,
 * and those classes can carry different `attendanceThresholdPct` values — so
 * there is no single correct bar to compare each student's rate against. This
 * is the server's configured default, used here only as a rough screen for
 * "worth a second look", not as a precise threshold. `perClass`, in contrast,
 * is one row per class and highlights against that class's REAL threshold —
 * see `perClassColumns` below.
 */
const DEFAULT_THRESHOLD_PCT = 60;

const statusTone: Record<UserStatus, 'green' | 'amber' | 'red'> = {
  pending: 'amber',
  verified: 'green',
  rejected: 'red',
  suspended: 'red',
};

const classTone = (status: ClassStatus): 'red' | 'slate' => (status === 'live' ? 'red' : 'slate');

type Tab = 'roster' | 'classes' | 'analytics';

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('roster');
  const [showSchedule, setShowSchedule] = useState(false);

  const { data: batch, error: batchError, refetch: refetchBatch } = useGetBatchQuery(id);
  const [createClass] = useCreateClassMutation();

  if (batchError) {
    return (
      <RequireAuth role="admin">
        <AdminShell>
          <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
            <p>{errorMessage(batchError)}</p>
            <button onClick={refetchBatch} className="mt-2 font-medium underline">Try again</button>
          </div>
        </AdminShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth role="admin">
      <AdminShell>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">{batch?.title ?? 'Batch'}</h1>
              {batch && (
                <div className="mt-1 flex items-center gap-2 text-sm text-neutral-70">
                  <span className="rounded bg-neutral-20 px-2 py-0.5 font-medium text-neutral-90">{batch.code}</span>
                  <span>{batch.studentCount ?? 0} students</span>
                </div>
              )}
            </div>
            <Button onClick={() => setShowSchedule(true)}>Schedule class</Button>
          </div>

          <div className="flex gap-1 rounded-lg border border-neutral-30 bg-white p-1">
            {(['roster', 'classes', 'analytics'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm capitalize ${
                  tab === t ? 'bg-neutral-100 text-white' : 'text-neutral-80 hover:bg-neutral-20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'roster' && <RosterTab batchId={id} />}
          {tab === 'classes' && <ClassesTab batchId={id} />}
          {tab === 'analytics' && <AnalyticsTab batchId={id} />}
        </div>

        <ScheduleClassDialog
          batchId={id}
          open={showSchedule}
          onClose={() => setShowSchedule(false)}
          onSubmit={async (values) => {
            try {
              await createClass({
                batchId: id,
                title: values.title,
                description: values.description || null,
                scheduledStartAt: new Date(values.scheduledStartAt).toISOString(),
                scheduledDurationMin: values.scheduledDurationMin,
              }).unwrap();
              toast.success('Class scheduled.');
              setShowSchedule(false);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />
      </AdminShell>
    </RequireAuth>
  );
}

function RosterTab({ batchId }: { batchId: string }) {
  const { data, isLoading, error, refetch } = useListBatchStudentsQuery(batchId);
  const rows = data ?? [];

  const columns: TableColumn<BatchStudent>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-neutral-100">{row.name}</span> },
    { key: 'email', header: 'Email', render: (row) => row.email ?? '—' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (row.status ? <Badge tone={statusTone[row.status]}>{row.status}</Badge> : '—'),
    },
    { key: 'joined', header: 'Joined', render: (row) => (row.createdAt ? relativeTime(row.createdAt) : '—') },
  ];

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-neutral-30" />;
  if (error) return <ListError message={errorMessage(error)} onRetry={refetch} />;

  return (
    <Card>
      <Table
        columns={columns}
        rows={rows}
        empty={<EmptyState title="No students" body="Verified students in this batch will appear here." />}
      />
    </Card>
  );
}

function ClassesTab({ batchId }: { batchId: string }) {
  const { data, isLoading, error, refetch } = useListClassesQuery({ batchId, limit: 100 });
  const rows = data?.rows ?? [];

  const columns: TableColumn<ClassSession>[] = [
    {
      key: 'title',
      header: 'Class',
      render: (row) => (
        <Link href={`/admin/classes/${row._id}`} className="font-medium text-brand-600 hover:text-brand-700">
          {row.title}
        </Link>
      ),
    },
    { key: 'when', header: 'When', render: (row) => formatClassTime(row.scheduledStartAt) },
    { key: 'duration', header: 'Duration', render: (row) => formatDuration(row.scheduledDurationMin * 60_000) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={classTone(row.status)}>{classStatusTone[row.status].label}</Badge>,
    },
  ];

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg bg-neutral-30" />;
  if (error) return <ListError message={errorMessage(error)} onRetry={refetch} />;

  return (
    <Card>
      <Table
        columns={columns}
        rows={rows}
        empty={<EmptyState title="No classes" body="Schedule a class for this batch to see it here." />}
      />
    </Card>
  );
}

function AnalyticsTab({ batchId }: { batchId: string }) {
  const { data, isLoading, error, refetch } = useBatchAnalyticsQuery({ id: batchId });

  if (isLoading) return <div className="h-64 animate-pulse rounded-lg bg-neutral-30" />;
  if (error) return <ListError message={errorMessage(error)} onRetry={refetch} />;
  if (!data) return null;

  const perStudentColumns: TableColumn<BatchAnalytics['perStudent'][number]>[] = [
    { key: 'name', header: 'Student', render: (row) => <span className="font-medium text-neutral-100">{row.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'classesHeld', header: 'Classes', render: (row) => row.classesHeld },
    { key: 'attended', header: 'Attended', render: (row) => row.attended },
    { key: 'rate', header: 'Rate', render: (row) => formatPercent(row.attendanceRate) },
    { key: 'avg', header: 'Avg presence', render: (row) => formatPercent(row.avgPresencePct) },
  ];

  const perClassColumns: TableColumn<BatchAnalytics['perClass'][number]>[] = [
    { key: 'title', header: 'Class', render: (row) => <span className="font-medium text-neutral-100">{row.title}</span> },
    { key: 'date', header: 'Date', render: (row) => formatClassTime(row.date) },
    { key: 'duration', header: 'Duration', render: (row) => formatDuration(row.durationMin * 60_000) },
    { key: 'enrolled', header: 'Enrolled', render: (row) => row.enrolled },
    { key: 'present', header: 'Present', render: (row) => row.present },
    { key: 'rate', header: 'Rate', render: (row) => formatPercent(row.attendanceRate) },
    { key: 'threshold', header: 'Threshold', render: (row) => `${row.attendanceThresholdPct}% needed` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Classes" value={data.summary.totalClasses} />
        <StatTile label="Students" value={data.summary.totalStudents} />
        <StatTile label="Overall rate" value={formatPercent(data.summary.overallAttendanceRate)} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-70">Per student</h2>
        <Card>
          <Table
            columns={perStudentColumns}
            rows={data.perStudent}
            rowClassName={(row) => (row.attendanceRate < DEFAULT_THRESHOLD_PCT ? 'bg-danger-50' : undefined)}
            empty={<EmptyState title="No data" body="Attendance appears once classes have ended." />}
          />
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-70">Per class</h2>
        <Card>
          <Table
            columns={perClassColumns}
            rows={data.perClass}
            rowClassName={(row) => (row.attendanceRate < row.attendanceThresholdPct ? 'bg-danger-50' : undefined)}
            empty={<EmptyState title="No data" body="Finished classes appear here with their attendance." />}
          />
        </Card>
      </section>
    </div>
  );
}

function ScheduleClassDialog({
  batchId,
  open,
  onClose,
  onSubmit,
}: {
  batchId: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateClassValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { batchId },
  });

  useEffect(() => {
    if (open) reset({ batchId });
  }, [open, reset, batchId]);

  return (
    <Modal open={open} onClose={onClose} title="Schedule class">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('batchId')} />
        <Input label="Title" error={errors.title?.message} {...register('title')} />
        <Input label="Description (optional)" error={errors.description?.message} {...register('description')} />
        <Input
          label="Start time"
          type="datetime-local"
          error={errors.scheduledStartAt?.message}
          {...register('scheduledStartAt')}
        />
        <Input
          label="Duration (minutes)"
          type="number"
          min={5}
          max={600}
          error={errors.scheduledDurationMin?.message}
          {...register('scheduledDurationMin')}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}

function ListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
      <p>{message}</p>
      <button onClick={onRetry} className="mt-2 font-medium underline">Try again</button>
    </div>
  );
}
