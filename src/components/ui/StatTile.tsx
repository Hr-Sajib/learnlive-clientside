import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type StatTileTone = 'default' | 'brand' | 'rose' | 'emerald' | 'amber' | 'violet' | 'teal';

const valueClass: Record<StatTileTone, string> = {
  default: 'text-text',
  brand: 'text-brand-600',
  rose: 'text-danger-600',
  emerald: 'text-success-600',
  amber: 'text-warning-600',
  violet: 'text-violet-600',
  teal: 'text-teal-600',
};

const iconBadgeClass: Record<StatTileTone, string> = {
  default: 'bg-surface-sunken text-text-subtle',
  brand: 'bg-brand-50 text-brand-600',
  rose: 'bg-danger-50 text-danger-600',
  emerald: 'bg-success-50 text-success-600',
  amber: 'bg-warning-50 text-warning-600',
  violet: 'bg-violet-50 text-violet-600',
  teal: 'bg-teal-50 text-teal-600',
};

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
  icon: Icon,
  href,
  style,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: StatTileTone;
  icon?: LucideIcon;
  href?: string;
  /** Pass `{ '--stagger': index }` to cascade a row of tiles in on mount. */
  style?: React.CSSProperties;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-text-subtle">{label}</div>
        {Icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBadgeClass[tone]}`}>
            <Icon size={18} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className={`mt-3 text-3xl font-semibold tabular-nums ${valueClass[tone]}`}>{value}</div>
      {hint && <div className="mt-1.5 text-xs text-text-subtlest">{hint}</div>}
    </>
  );

  const className =
    'animate-rise-in transition-ads rounded-lg border border-border bg-surface p-5 shadow-raised';

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} block hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-overlay`}
        style={{ ...style, transitionProperty: 'border-color, box-shadow, transform' }}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}
