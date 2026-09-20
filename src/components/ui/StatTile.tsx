import Link from 'next/link';
import type { ReactNode } from 'react';

type StatTileTone = 'default' | 'brand' | 'rose' | 'emerald' | 'amber';

const toneClass: Record<StatTileTone, string> = {
  default: 'text-neutral-100',
  brand: 'text-brand-600',
  rose: 'text-danger-600',
  emerald: 'text-success-600',
  amber: 'text-warning-600',
};

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: StatTileTone;
  href?: string;
}) {
  const content = (
    <>
      <div className="text-sm font-medium text-neutral-70">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-neutral-50">{hint}</div>}
    </>
  );

  const className = 'transition-ads rounded-md border border-neutral-30 bg-white p-4 shadow-raised';

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} block hover:border-brand-300 hover:shadow-overlay`}
        style={{ transitionProperty: 'border-color, box-shadow' }}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
