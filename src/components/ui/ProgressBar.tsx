type ProgressTone = 'brand' | 'green' | 'amber' | 'red';

const barClass: Record<ProgressTone, string> = {
  brand: 'bg-brand-600',
  green: 'bg-success-600',
  amber: 'bg-warning-600',
  red: 'bg-danger-600',
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
      className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-20"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClass[tone]}`}
        style={{ width: `${pct}%` }}
      />
      {marker != null && (
        <div
          className="absolute inset-y-0 w-0.5 bg-neutral-100/50"
          style={{ left: `${marker}%` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
