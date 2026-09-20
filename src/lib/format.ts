import { format, formatDistanceToNowStrict, isToday, isTomorrow } from 'date-fns';

/** "1h 24m", "45m", "38s" — for durations shown next to attendance figures. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0m';

  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (totalMinutes > 0) return `${totalMinutes}m`;
  return `${Math.floor(ms / 1000)}s`;
}

/** "Today, 8:00 PM" / "Tomorrow, 10:30 AM" / "12 Jan, 8:00 PM" */
export function formatClassTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const time = format(date, 'h:mm a');

  if (isToday(date)) return `Today, ${time}`;
  if (isTomorrow(date)) return `Tomorrow, ${time}`;
  return `${format(date, 'd MMM')}, ${time}`;
}

/** "in 20 minutes" / "2 hours ago" */
export function relativeTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const past = date.getTime() < Date.now();
  const distance = formatDistanceToNowStrict(date);
  return past ? `${distance} ago` : `in ${distance}`;
}

export const formatPercent = (value: number): string => `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;

/**
 * The colour language used for attendance everywhere in the app. Keep these
 * three in step so a green badge always means the same thing.
 */
export const attendanceTone = {
  present: { label: 'Present', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  absent: { label: 'Absent', className: 'bg-rose-100 text-rose-800 border-rose-200' },
} as const;

export const classStatusTone = {
  scheduled: { label: 'Scheduled', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  live: { label: 'Live', className: 'bg-red-100 text-red-700 border-red-200' },
  ended: { label: 'Ended', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-100 text-slate-400 border-slate-200' },
} as const;
