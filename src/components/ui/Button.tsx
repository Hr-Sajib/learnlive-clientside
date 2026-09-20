import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-raised hover:bg-brand-700 hover:shadow-overlay active:bg-brand-800',
  secondary:
    'border border-border bg-surface text-text hover:border-border-strong hover:bg-surface-sunken active:bg-surface-sunken',
  danger: 'bg-danger-600 text-white shadow-raised hover:bg-danger-700 hover:shadow-overlay active:bg-danger-700',
  ghost: 'text-text-subtle hover:bg-surface-sunken active:bg-surface-sunken',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`transition-ads inline-flex items-center justify-center gap-2 rounded-sm font-medium active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 ${variantClass[variant]} ${sizeClass[size]} ${className ?? ''}`}
      style={{ transitionProperty: 'background-color, border-color, box-shadow, transform, opacity' }}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
