'use client';

import * as React from 'react';
import { Input, InputProps } from '@/components/ui/Input';

interface MoneyInputProps
  extends Omit<InputProps, 'type' | 'value' | 'onChange' | 'inputMode'> {
  value?: number | null;
  onValueChange: (value: number | undefined) => void;
}

const numberFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0,
});

function formatMoney(value?: number | null) {
  if (value === undefined || value === null) return '';
  return numberFormatter.format(value);
}

function parseMoney(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return undefined;

  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onValueChange, placeholder = '150.000', ...props }, ref) => (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={formatMoney(value)}
      rightElement="đ"
      onChange={(event) => onValueChange(parseMoney(event.target.value))}
    />
  )
);

MoneyInput.displayName = 'MoneyInput';
