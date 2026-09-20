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
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-neutral-100">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`transition-ads h-9 w-full rounded-sm border bg-white px-2.5 text-sm text-neutral-100 placeholder:text-neutral-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 ${
          error ? 'border-danger-500' : 'border-neutral-30 hover:border-neutral-40'
        } ${className ?? ''}`}
        style={{ transitionProperty: 'border-color, box-shadow' }}
        {...rest}
      />
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-neutral-70">{hint}</p>}
    </div>
  );
}
