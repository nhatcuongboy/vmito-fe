'use client';

import { useEffect, useRef, useState } from 'react';
import { AppSearchBar, AppSearchBarProps } from './AppSearchBar';

export interface DebouncedAppSearchBarProps
  extends Omit<AppSearchBarProps, 'value' | 'onChange'> {
  /** External (source-of-truth) value, e.g. derived from the URL. */
  value: string;
  /** Called with the debounced value once the user pauses typing. */
  onChange: (value: string) => void;
  /** Debounce delay in ms before onChange fires. Defaults to 400. */
  debounceMs?: number;
}

/**
 * AppSearchBar with an internal, immediately-updated input buffer and a
 * debounced `onChange`. This decouples the snappy typing feel from the
 * (potentially slow) side effect the parent runs on change — typically a URL
 * navigation that re-renders the page.
 *
 * The critical detail: the external `value` prop is only synced back into the
 * local buffer when it changes from something OTHER than our own debounced
 * emit (clear button, filter reset, back/forward navigation). Syncing on our
 * own echo would overwrite characters typed while the navigation was still in
 * flight — the classic "typed 'nhatcuong' but only 'ntg' survived" bug.
 */
export function DebouncedAppSearchBar({
  value,
  onChange,
  debounceMs = 400,
  ...rest
}: DebouncedAppSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef(value);

  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  // Flush any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (val: string) => {
    setLocalValue(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastEmittedRef.current = val;
      onChange(val);
    }, debounceMs);
  };

  return <AppSearchBar {...rest} value={localValue} onChange={handleChange} />;
}
