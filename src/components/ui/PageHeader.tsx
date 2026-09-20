import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon size={22} strokeWidth={2} />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-text-subtle">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
