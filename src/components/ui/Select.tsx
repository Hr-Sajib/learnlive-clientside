'use client';

import { useId, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, options, className, id, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`transition-ads h-9 w-full rounded-sm border bg-surface px-2.5 text-sm text-text focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-danger-500' : 'border-border hover:border-border-strong'
        } ${className ?? ''}`}
        style={{ transitionProperty: 'border-color, box-shadow' }}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-text-subtle">{hint}</p>}
    </div>
  );
}
