import type { ReactNode } from 'react';

export function Card({
  title,
  action,
  children,
  style,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="animate-rise-in transition-ads rounded-lg border border-border bg-surface shadow-raised" style={style}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
