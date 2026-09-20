import type { ReactNode } from 'react';

type BadgeTone = 'green' | 'amber' | 'red' | 'slate';

/**
 * ADS's "Lozenge" is a tight rounded rectangle, not a full pill — that's
 * the detail that makes a status chip read as Atlassian rather than generic.
 */
const toneClass: Record<BadgeTone, string> = {
  green: 'bg-success-50 text-success-600',
  amber: 'bg-warning-50 text-warning-600',
  red: 'bg-danger-50 text-danger-600',
  slate: 'bg-surface-sunken text-text-subtle',
};

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
