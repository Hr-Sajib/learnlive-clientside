'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Video } from 'lucide-react';
import { useListClassesQuery } from '@/store/api/classApi';
import { errorMessage } from '@/store/api/baseApi';
import type { ClassStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatClassTime, formatDuration, classStatusTone } from '@/lib/format';

const toneForStatus = (status: ClassStatus): 'red' | 'slate' => (status === 'live' ? 'red' : 'slate');

export default function StudentClassesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error, refetch } = useListClassesQuery({ page, limit: 20 });

  const rows = data?.rows ?? [];
  const meta = data?.meta;

  return (
        <div className="space-y-6">
          <PageHeader icon={Video} title="Classes" subtitle="Everything scheduled for your batch." />

          {isLoading ? (
            <SkeletonRows count={5} />
          ) : error ? (
            <ListError message={errorMessage(error)} onRetry={refetch} />
          ) : rows.length === 0 ? (
            <EmptyState
              title="No classes yet"
              body="Classes scheduled for your batch will appear here."
            />
          ) : (
            <div className="space-y-3">
              {rows.map((cls) => (
                <Card key={cls._id}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-text">{cls.title}</div>
                      <div className="text-sm text-text-subtle">
                        {formatClassTime(cls.scheduledStartAt)} ·{' '}
                        {formatDuration(cls.scheduledDurationMin * 60_000)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={toneForStatus(cls.status)}>
                        {classStatusTone[cls.status].label}
                      </Badge>
                      {cls.status === 'live' && (
                        <Link
                          href={`/classes/${cls._id}/room`}
                          className="inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                        >
                          Join now
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-surface-sunken" />
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
