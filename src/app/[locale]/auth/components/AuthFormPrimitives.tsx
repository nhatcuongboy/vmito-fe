'use client';

import { Button } from '@/components/primitives/button';
import { Input } from '@/components/primitives/input';
import { Label } from '@/components/primitives/label';
import { Spinner } from '@/components/primitives/spinner';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

export function AuthPageContent({ children }: { children: ReactNode }) {
  return (
    <main data-slot="auth-page-content" className="auth-page-content">
      {children}
    </main>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <section data-slot="auth-card" className="auth-card">
      <div className="auth-card-stack">{children}</div>
    </section>
  );
}

export function AuthHeading({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <header className="auth-heading">
      <h1>{title}</h1>
      {description ? (
        <p className="auth-heading-description">{description}</p>
      ) : null}
    </header>
  );
}

interface AuthFieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function AuthField({
  id,
  label,
  error,
  required = false,
  children,
}: AuthFieldProps) {
  return (
    <div
      data-slot="auth-field"
      className="auth-field"
      data-invalid={error ? '' : undefined}
    >
      <Label htmlFor={id} className="auth-field-label">
        {label}
        {required ? (
          <span aria-hidden className="text-red-500">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="auth-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const alertStyles = {
  error:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
  success:
    'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300',
} as const;

export function AuthAlert({
  children,
  variant,
}: {
  children: ReactNode;
  variant: keyof typeof alertStyles;
}) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('auth-alert', alertStyles[variant])}
    >
      {children}
    </div>
  );
}

export function AuthPasswordInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  const t = useTranslations('common');
  const [visible, setVisible] = useState(false);
  const label = visible ? t('hidePassword') : t('showPassword');

  return (
    <div className="auth-password-control">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pe-10', className)}
      />
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setVisible((current) => !current)}
        className="auth-password-toggle"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" />
        ) : (
          <Eye aria-hidden className="size-4" />
        )}
      </button>
    </div>
  );
}

export function AuthSubmitButton({
  loading,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button
      className="auth-submit-button"
      size="lg"
      disabled={loading}
      {...props}
    >
      {loading ? <Spinner aria-hidden className="size-4" /> : null}
      {children}
    </Button>
  );
}

export function AuthLoadingState({ label }: { label?: ReactNode }) {
  const t = useTranslations('common');
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner
          aria-label={label ? undefined : t('loading')}
          aria-hidden={label ? true : undefined}
          className="size-8 text-green-500"
        />
        {label ? <p className="text-muted-foreground">{label}</p> : null}
      </div>
    </main>
  );
}

export function AuthInlineLoadingState() {
  const t = useTranslations('common');
  return (
    <div className="flex w-full justify-center py-6">
      <Spinner aria-label={t('loading')} className="size-6 text-green-500" />
    </div>
  );
}

export const authLinkClassName = 'auth-link';

export const authInputClassName = 'auth-input';

export const authSelectClassName = 'auth-select';
