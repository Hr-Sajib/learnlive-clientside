'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { RequireAuth } from '@/components/RequireAuth';
import { AdminShell } from '@/components/AdminShell';
import {
  useListUsersQuery,
  useVerifyUserMutation,
  useRejectUserMutation,
  useSuspendUserMutation,
} from '@/store/api/adminApi';
import { useListBatchesQuery } from '@/store/api/batchApi';
import { errorMessage } from '@/store/api/baseApi';
import { rejectUserSchema } from '@/lib/validation';
import { relativeTime } from '@/lib/format';
import type { Batch, PendingUser, UserStatus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Table, type TableColumn } from '@/components/ui/Table';

const STATUSES: UserStatus[] = ['pending', 'verified', 'rejected', 'suspended'];

function batchIdOf(user: PendingUser): string | undefined {
  const batch = user.batch as unknown as { _id?: string; id?: string } | null;
  return batch?._id ?? batch?.id;
}

export default function AdminUsersPage() {
  const [status, setStatus] = useState<UserStatus>('pending');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, error, refetch } = useListUsersQuery({ status, page, search });
  const { data: batchesData } = useListBatchesQuery({ limit: 100 });
  const batches = batchesData?.rows ?? [];

  const [verifyUser] = useVerifyUserMutation();
  const [rejectUser] = useRejectUserMutation();
  const [suspendUser] = useSuspendUserMutation();

  const [verifyTarget, setVerifyTarget] = useState<PendingUser | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<PendingUser | null>(null);

  const rows = data?.rows ?? [];
  const meta = data?.meta;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const columns: TableColumn<PendingUser>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-neutral-100">{row.name}</span> },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'batch', header: 'Batch', render: (row) => row.requestedBatchCode ?? '—' },
    { key: 'registered', header: 'Registered', render: (row) => relativeTime(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => setVerifyTarget(row)}>
                Verify
              </Button>
              <Button size="sm" variant="danger" onClick={() => setRejectTarget(row)}>
                Reject
              </Button>
            </>
          )}
          {row.status === 'verified' && (
            <Button size="sm" variant="danger" onClick={() => setSuspendTarget(row)}>
              Suspend
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <RequireAuth role="admin">
      <AdminShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-neutral-100">Users</h1>
            <form onSubmit={onSearch} className="flex gap-2">
              <Input
                placeholder="Search name, email or phone"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>

          <div className="flex gap-1 rounded-lg border border-neutral-30 bg-white p-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm capitalize ${
                  status === s ? 'bg-neutral-100 text-white' : 'text-neutral-80 hover:bg-neutral-20'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-neutral-30" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-4 text-sm text-danger-700">
              <p>{errorMessage(error)}</p>
              <button onClick={refetch} className="mt-2 font-medium underline">Try again</button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              title={`No ${status} users`}
              body={
                status === 'pending'
                  ? 'New registrations will show up here waiting for approval.'
                  : `There are no ${status} students right now.`
              }
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
              <span className="text-sm text-neutral-70">Page {meta.page} of {meta.totalPages}</span>
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

        <VerifyDialog
          user={verifyTarget}
          batches={batches}
          onClose={() => setVerifyTarget(null)}
          onConfirm={async (id, batchId) => {
            try {
              await verifyUser(batchId ? { id, batchId } : { id }).unwrap();
              toast.success('Student verified.');
              setVerifyTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />

        <RejectDialog
          user={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={async (id, reason) => {
            try {
              await rejectUser({ id, reason }).unwrap();
              toast.success('Registration declined.');
              setRejectTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />

        <SuspendDialog
          user={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={async (id, reason) => {
            try {
              await suspendUser({ id, reason }).unwrap();
              toast.success('Student suspended.');
              setSuspendTarget(null);
            } catch (err) {
              toast.error(errorMessage(err));
            }
          }}
        />
      </AdminShell>
    </RequireAuth>
  );
}

function VerifyDialog({
  user,
  batches,
  onClose,
  onConfirm,
}: {
  user: PendingUser | null;
  batches: Batch[];
  onClose: () => void;
  onConfirm: (id: string, batchId?: string) => void;
}) {
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (!user) return;
    const current = batchIdOf(user);
    const match = batches.find((b) => b._id === current) ?? batches.find((b) => b.code === user.requestedBatchCode);
    setSelected(match?._id ?? '');
  }, [user, batches]);

  const options = batches.map((b) => ({ value: b._id, label: `${b.code} — ${b.title}` }));

  return (
    <Modal open={!!user} onClose={onClose} title="Verify student">
      {user && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-80">
            Approve <span className="font-medium text-neutral-100">{user.name}</span> and place them in a
            batch. Leave the batch unchanged unless they mistyped the code.
          </p>
          <Select
            label="Batch"
            options={options}
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              disabled={!selected}
              onClick={() => {
                const current = batchIdOf(user);
                onConfirm(user._id, selected && selected !== current ? selected : undefined);
              }}
            >
              Verify
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function RejectDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: PendingUser | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ reason: string }>({ resolver: zodResolver(rejectUserSchema) });

  useEffect(() => {
    if (user) reset();
  }, [user, reset]);

  return (
    <Modal open={!!user} onClose={onClose} title="Reject registration">
      {user && (
        <form
          onSubmit={handleSubmit((values) => onConfirm(user._id, values.reason))}
          className="space-y-4"
        >
          <p className="text-sm text-neutral-80">
            <span className="font-medium text-neutral-100">{user.name}</span> will see this reason when
            they next try to sign in.
          </p>
          <Input
            label="Reason"
            error={errors.reason?.message}
            {...register('reason')}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="danger">Reject</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function SuspendDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: PendingUser | null;
  onClose: () => void;
  onConfirm: (id: string, reason?: string) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [user]);

  return (
    <Modal open={!!user} onClose={onClose} title="Suspend student">
      {user && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-80">
            Suspending <span className="font-medium text-neutral-100">{user.name}</span> immediately
            revokes their access.
          </p>
          <Input
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => onConfirm(user._id, reason.trim() ? reason.trim() : undefined)}
            >
              Suspend
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
