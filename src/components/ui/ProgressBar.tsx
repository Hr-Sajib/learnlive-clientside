type ProgressTone = 'brand' | 'green' | 'amber' | 'red';

const barClass: Record<ProgressTone, string> = {
  brand: 'bg-brand-600',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
};

export function ProgressBar({
  value,
  threshold,
  tone = 'brand',
}: {
  value: number;
  threshold?: number;
  tone?: ProgressTone;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const marker = threshold == null ? null : Math.max(0, Math.min(100, threshold));

  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={`h-full rounded-full ${barClass[tone]}`} style={{ width: `${pct}%` }} />
      {marker != null && (
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-900/60"
          style={{ left: `${marker}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
