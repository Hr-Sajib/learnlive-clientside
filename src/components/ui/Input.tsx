'use client';

import { useId, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`transition-ads h-9 w-full rounded-sm border bg-surface px-2.5 text-sm text-text placeholder:text-text-subtlest focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-danger-500' : 'border-border hover:border-border-strong'
        } ${className ?? ''}`}
        style={{ transitionProperty: 'border-color, box-shadow' }}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-text-subtle">{hint}</p>}
    </div>
  );
}
