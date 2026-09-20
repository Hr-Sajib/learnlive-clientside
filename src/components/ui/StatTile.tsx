import Link from 'next/link';
import type { ReactNode } from 'react';

type StatTileTone = 'default' | 'brand' | 'rose' | 'emerald' | 'amber';

const toneClass: Record<StatTileTone, string> = {
  default: 'text-slate-900',
  brand: 'text-brand-600',
  rose: 'text-rose-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
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
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </>
  );

  const className = 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm';

  if (href) {
    return (
      <Link href={href} className={`${className} block transition hover:border-slate-300`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
