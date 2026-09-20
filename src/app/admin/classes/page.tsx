'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminShell } from '@/components/AdminShell';
import {
  useCancelClassMutation,
  useEndClassMutation,
  useListClassesQuery,
  useStartClassMutation,
  useUpdateClassMutation,
} from '@/store/api/classApi';
import { useListBatchesQuery } from '@/store/api/batchApi';
import { errorMessage } from '@/store/api/baseApi';
import { updateClassSchema, type UpdateClassValues } from '@/lib/validation';
import { classStatusTone, formatClassTime } from '@/lib/format';
import type { Batch, ClassSession, ClassStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';

const toneForStatus = (status: ClassStatus): 'red' | 'slate' => (status === 'live' ? 'red' : 'slate');

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminClassesPage() {
  const [page, setPage] = useState(1);
  const [batchId, setBatchId] = useState('');
  const [status, setStatus] = useState<ClassStatus | ''>('');

  const { data: batchesData } = useListBatchesQuery({ limit: 100 });
  const batches = batchesData?.rows ?? [];

  const { data, isLoading, isFetching, error, refetch } = useListClassesQuery({
    page,
    batchId: batchId || undefined,
    status: status || undefined,
  });

  const [startClass] = useStartClassMutation();
  const [endClass] = useEndClassMutation();
  const [cancelClass] = useCancelClassMutation();
  const [updateClass] = useUpdateClassMutation();

  const [editTarget, setEditTarget] = useState<ClassSession | null>(null);
  const [endTarget, setEndTarget] = useState<ClassSession | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ClassSession | null>(null);

  const rows = data?.rows ?? [];
  const meta = data?.meta;

  const batchCodeOf = (cls: ClassSession): string =>
    typeof cls.batch === 'object' ? cls.batch.code : '—';

  const columns: TableColumn<ClassSession>[] = [
    {
      key: 'title',
      header: 'Class',
      render: (row) => <span className="font-medium text-slate-900">{row.title}</span>,
    },
    { key: 'batch', header: 'Batch', render: (row) => batchCodeOf(row) },
    { key: 'when', header: 'When', render: (row) => formatClassTime(row.scheduledStartAt) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={toneForStatus(row.status)}>{classStatusTone[row.status].label}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'scheduled' && (
            <>
              <Button size="sm" onClick={() => startClass(row._id).unwrap().then(() => toast.success('Class is live. Students can join now.')).catch((e) => toast.error(errorMessage(e)))}>
                Start
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditTarget(row)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCancelTarget(row)}>
                Cancel
              </Button>
            </>
          )}
          {row.status === 'live' && (
            <>
              <Link
                href={`/admin/classes/${row._id}`}
                className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Open panel
              </Link>
              <Button size="sm" variant="danger" onClick={() => setEndTarget(row)}>
                End
              </Button>
            </>
          )}
          {row.status === 'ended' && (
            <Link
              href={`/admin/classes/${row._id}`}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View attendance
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <RequireAuth role="admin">
      <AdminShell>
        <div className="space-y-4">
          <h1 className="text-lg font-semibold text-slate-900">Classes</h1>

          <div className="flex flex-wrap gap-2">
            <Select
              value={batchId}
              onChange={(e) => {
                setBatchId(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All batches' },
                ...batches.map((b) => ({ value: b._id, label: `${b.code} — ${b.title}` })),
              ]}
            />
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ClassStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'live', label: 'Live' },
                { value: 'ended', label: 'Ended' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{errorMessage(error)}</p>
              <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No classes" body="Classes scheduled across batches will appear here." />
          ) : (
            <Card>
              <Table columns={columns} rows={rows} />
            </Card>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="secondary" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page >= meta.totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>

        <EditClassDialog
          cls={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={async (values) => {
            if (!editTarget) return;
            try {
              await updateClass({
                id: editTarget._id,
                body: {
                  title: values.title,
                  description: values.description || null,
                  scheduledStartAt: new Date(values.scheduledStartAt).toISOString(),
                  scheduledDurationMin: values.scheduledDurationMin,
                },
              }).unwrap();
              toast.success('Class updated.');
              setEditTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />

        <ConfirmDialog
          open={!!endTarget}
          title="End class"
          body={
            endTarget
              ? `Ending "${endTarget.title}" is not undoable and finalises everyone's attendance.`
              : ''
          }
          confirmLabel="End class"
          tone="danger"
          onClose={() => setEndTarget(null)}
          onConfirm={async () => {
            if (!endTarget) return;
            try {
              const result = await endClass(endTarget._id).unwrap();
              toast.success(
                `Class ended. ${result.presentCount} of ${result.enrolledCount} students met the attendance threshold.`,
              );
              setEndTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />

        <ConfirmDialog
          open={!!cancelTarget}
          title="Cancel class"
          body={cancelTarget ? `Cancel "${cancelTarget.title}"? It will no longer run.` : ''}
          confirmLabel="Cancel class"
          tone="danger"
          onClose={() => setCancelTarget(null)}
          onConfirm={async () => {
            if (!cancelTarget) return;
            try {
              await cancelClass(cancelTarget._id).unwrap();
              toast.success('Class cancelled.');
              setCancelTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />
      </AdminShell>
    </RequireAuth>
  );
}

function EditClassDialog({
  cls,
  onClose,
  onSubmit,
}: {
  cls: ClassSession | null;
  onClose: () => void;
  onSubmit: (values: UpdateClassValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateClassValues>({ resolver: zodResolver(updateClassSchema) });

  useEffect(() => {
    if (cls) {
      reset({
        title: cls.title,
        description: cls.description ?? '',
        scheduledStartAt: toLocalInput(cls.scheduledStartAt),
        scheduledDurationMin: cls.scheduledDurationMin,
      });
    }
  }, [cls, reset]);

  return (
    <Modal open={!!cls} onClose={onClose} title="Edit class">
      {cls && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Input label="Description (optional)" error={errors.description?.message} {...register('description')} />
          <Input label="Start time" type="datetime-local" error={errors.scheduledStartAt?.message} {...register('scheduledStartAt')} />
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
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
