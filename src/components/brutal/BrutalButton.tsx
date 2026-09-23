import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ai' | 'ghost' | 'info';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper',
  secondary: 'bg-surface text-ink',
  danger: 'bg-coral text-ink',
  success: 'bg-lime text-ink',
  ai: 'bg-purple text-white',
  info: 'bg-blue text-white',
  ghost: 'bg-transparent text-ink',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-[10px] gap-1.5',
  md: 'px-4 py-2.5 text-[11px] gap-2',
  lg: 'px-6 py-3.5 text-sm gap-2.5',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-[18px] w-[18px]',
};

/**
 * Signature neobrutalist button physics:
 * 4px border · 5px hard shadow · hover travels 2px · active flattens to 0.
 * Small buttons use a lighter 3px variant so dense toolbars stay readable.
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    size === 'sm' ? 'press-sm' : 'press',
    'inline-flex select-none items-center justify-center rounded-brutal border-4 border-ink font-bold uppercase tracking-wider',
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface BrutalButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {}

export function BrutalButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  type = 'button',
  ...rest
}: BrutalButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, cn(full && 'w-full', className))}
      {...rest}
    >
      {icon && <span className={cn('shrink-0', ICON_SIZE[size])}>{icon}</span>}
      {children && <span className="truncate">{children}</span>}
      {iconRight && <span className={cn('shrink-0', ICON_SIZE[size])}>{iconRight}</span>}
    </button>
  );
}

export interface BrutalLinkProps extends BaseProps {
  to: string;
  ariaLabel?: string;
}

export function BrutalLink({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  ariaLabel,
}: BrutalLinkProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={buttonClasses(variant, size, cn(full && 'w-full', className))}
    >
      {icon && <span className={cn('shrink-0', ICON_SIZE[size])}>{icon}</span>}
      {children && <span className="truncate">{children}</span>}
      {iconRight && <span className={cn('shrink-0', ICON_SIZE[size])}>{iconRight}</span>}
    </Link>
  );
}

/** Square icon-only control for dense toolbars. */
export function IconButton({
  variant = 'secondary',
  className,
  label,
  icon,
  size = 'md',
  ...rest
}: BrutalButtonProps & { label: string }) {
  const box = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={buttonClasses(variant, 'sm', cn('p-0', box, className))}
      {...rest}
    >
      <span className={cn(ICON_SIZE[size])}>{icon}</span>
    </button>
  );
}
