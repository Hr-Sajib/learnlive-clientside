'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminShell } from '@/components/AdminShell';
import { useCreateBatchMutation, useListBatchesQuery, useUpdateBatchMutation } from '@/store/api/batchApi';
import { errorMessage } from '@/store/api/baseApi';
import { createBatchSchema, type CreateBatchValues } from '@/lib/validation';
import { relativeTime } from '@/lib/format';
import type { Batch } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';

export default function AdminBatchesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'active' | 'archived' | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Batch | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useListBatchesQuery({
    page,
    status: status || undefined,
    search: search || undefined,
  });
  const [createBatch] = useCreateBatchMutation();
  const [updateBatch] = useUpdateBatchMutation();

  const rows = data?.rows ?? [];
  const meta = data?.meta;

  const columns: TableColumn<Batch>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (row) => (
        <Link href={`/admin/batches/${row._id}`} className="font-medium text-brand-600 hover:text-brand-700">
          {row.code}
        </Link>
      ),
    },
    { key: 'title', header: 'Title', render: (row) => <span className="font-medium text-slate-900">{row.title}</span> },
    { key: 'students', header: 'Students', render: (row) => row.studentCount ?? 0 },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'active' ? 'green' : 'slate'}>
          {row.status}
        </Badge>
      ),
    },
    { key: 'created', header: 'Created', render: (row) => relativeTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setArchiveTarget(row)}
          >
            {row.status === 'active' ? 'Archive' : 'Unarchive'}
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
            <h1 className="text-lg font-semibold text-slate-900">Batches</h1>
            <Button onClick={() => setShowNew(true)}>New batch</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setSearch(searchInput.trim());
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Search code or title"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'active' | 'archived' | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p>{errorMessage(error)}</p>
              <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title="No batches yet"
              body="Create a batch so students have a code to register with."
              action={<Button onClick={() => setShowNew(true)}>New batch</Button>}
            />
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

        <NewBatchDialog
          open={showNew}
          onClose={() => setShowNew(false)}
          onSubmit={async (values) => {
            try {
              const batch = await createBatch({
                code: values.code,
                title: values.title,
                description: values.description || null,
              }).unwrap();
              toast.success(`Batch ${batch.code} created — share this code with students.`);
              setShowNew(false);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />

        <ConfirmDialog
          open={!!archiveTarget}
          title={archiveTarget?.status === 'active' ? 'Archive batch' : 'Unarchive batch'}
          body={
            archiveTarget
              ? `${archiveTarget.status === 'active' ? 'Archive' : 'Unarchive'} batch ${archiveTarget.code} (${archiveTarget.title})?`
              : ''
          }
          confirmLabel={archiveTarget?.status === 'active' ? 'Archive' : 'Unarchive'}
          tone={archiveTarget?.status === 'active' ? 'danger' : 'primary'}
          onClose={() => setArchiveTarget(null)}
          onConfirm={async () => {
            if (!archiveTarget) return;
            try {
              await updateBatch({
                id: archiveTarget._id,
                body: { status: archiveTarget.status === 'active' ? 'archived' : 'active' },
              }).unwrap();
              toast.success(`Batch ${archiveTarget.code} updated.`);
              setArchiveTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />
      </AdminShell>
    </RequireAuth>
  );
}

function NewBatchDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CreateBatchValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBatchValues>({ resolver: zodResolver(createBatchSchema) });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  return (
    <Modal open={open} onClose={onClose} title="New batch">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Batch code"
          placeholder="e.g. B12-FRONTEND"
          hint="Letters, numbers and hyphens only. Students will type this to register."
          error={errors.code?.message}
          {...register('code')}
        />
        <Input label="Title" error={errors.title?.message} {...register('title')} />
        <Input label="Description (optional)" error={errors.description?.message} {...register('description')} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create batch</Button>
        </div>
      </form>
    </Modal>
  );
}
