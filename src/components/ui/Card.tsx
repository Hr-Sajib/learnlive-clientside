import type { ReactNode } from 'react';

export function Card({
  title,
  action,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="transition-ads rounded-md border border-neutral-30 bg-white shadow-raised">
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-neutral-20 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-neutral-100">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
