import type { ReactNode } from 'react';

export function EmptyState({
  title,
  body,
  action,
}: {
  title: ReactNode;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-neutral-40 bg-white px-6 py-12 text-center">
      <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-70">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
