export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]',
  }[size];

  return (
    <span
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizeClass}`}
      role="status"
      aria-label="Loading"
    />
  );
}
