'use client';
import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// ─── Core types ───────────────────────────────────────────────────────────────

/**
 * Defines how a single filter field is serialized to/from a URL query param.
 * @template T - The typed value of the filter field.
 */
export interface UrlFilterField<T> {
  /** Convert the URL string (null when the param is absent) to the typed value. */
  fromQuery: (raw: string | null) => T;
  /** Convert the typed value to a URL string. Return null/undefined to omit the param. */
  toQuery: (value: T) => string | null | undefined;
}

/** Schema describing the full set of filters for a given page. */
export type UrlFiltersSchema<T extends Record<string, unknown>> = {
  [K in keyof T]: UrlFilterField<T[K]>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Generic hook that syncs a group of typed filter values to/from URL search params.
 *
 * Returns `[filters, setFilters, resetFilters]`:
 * - `filters`      — Current typed values derived from the URL (read-only).
 * - `setFilters`   — Partially updates one or more filters in the URL.
 * - `resetFilters` — Removes all filter params from the URL.
 *
 * Pass `options.replace = false` to use `router.push` instead of `router.replace`
 * (adds a browser history entry on every filter change).
 *
 * @example
 * ```ts
 * const schema = { q: stringField(), city: stringArrayField() };
 * const [filters, setFilters, resetFilters] = useUrlFilters(schema);
 * // filters.q === '' | 'some keyword'
 * // filters.city === [] | ['HCM', 'HN']
 * setFilters({ q: 'cầu lông' });
 * resetFilters();
 * ```
 */
export const useUrlFilters = <T extends Record<string, unknown>>(
  schema: UrlFiltersSchema<T>,
  options?: { replace?: boolean }
): readonly [T, (updates: Partial<T>) => void, () => void] => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace = true } = options ?? {};

  // Derive current filter values from URL — only recomputes when params change.
  const filters = useMemo<T>(() => {
    const result = {} as T;
    for (const key in schema) {
      const raw = searchParams.get(key);
      (result as Record<string, unknown>)[key] = schema[key].fromQuery(raw);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /** Write one or more filter updates to the URL. */
  const setFilters = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key in updates) {
        if (!Object.prototype.hasOwnProperty.call(updates, key)) continue;
        const serialized = schema[key]?.toQuery(updates[key] as T[typeof key]);
        if (serialized == null || serialized === '') {
          params.delete(key);
        } else {
          params.set(key, serialized);
        }
      }
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname, router, replace]
  );

  /** Remove all filter params from the URL. */
  const resetFilters = useCallback(() => {
    if (replace) {
      router.replace(pathname);
    } else {
      router.push(pathname);
    }
  }, [pathname, router, replace]);

  return [filters, setFilters, resetFilters] as const;
};

// ─── Pre-built field helpers ──────────────────────────────────────────────────

/**
 * A URL filter field for a plain string.
 * Omitted from URL when empty.
 *
 * @example stringField()        // defaults to ''
 * @example stringField('all')   // custom default
 */
export const stringField = (defaultValue = ''): UrlFilterField<string> => ({
  fromQuery: (raw) => raw ?? defaultValue,
  toQuery: (value) => (value ? value : null),
});

/**
 * A URL filter field for a comma-separated array of strings.
 * Omitted from URL when empty.
 *
 * URL format: `key=value1,value2,value3`
 *
 * @example stringArrayField()  // field for string[]
 */
export const stringArrayField = (): UrlFilterField<string[]> => ({
  fromQuery: (raw) =>
    raw
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  toQuery: (value) => (value.length > 0 ? value.join(',') : null),
});

/**
 * A URL filter field for a boolean value.
 * Stored as `'1'` when true, omitted from URL when false.
 *
 * @example booleanField()        // defaults to false
 * @example booleanField(true)    // defaults to true
 */
export const booleanField = (
  defaultValue = false
): UrlFilterField<boolean> => ({
  fromQuery: (raw) => (raw === '1' ? true : defaultValue),
  toQuery: (value) => (value ? '1' : null),
});

/**
 * A URL filter field for a numeric value.
 * Omitted from URL when equal to the default.
 *
 * @example numberField(1)   // page number, defaults to 1
 */
export const numberField = (defaultValue = 0): UrlFilterField<number> => ({
  fromQuery: (raw) => (raw != null ? Number(raw) : defaultValue),
  toQuery: (value) => (value !== defaultValue ? String(value) : null),
});

/**
 * A URL filter field for a comma-separated array of numbers.
 * Omitted from URL when empty.
 *
 * URL format: `key=1,2,3`
 *
 * @example numberArrayField()  // field for number[]
 */
export const numberArrayField = (): UrlFilterField<number[]> => ({
  fromQuery: (raw) =>
    raw
      ? raw
          .split(',')
          .map((s) => Number(s.trim()))
          .filter((n) => !isNaN(n))
      : [],
  toQuery: (value) => (value.length > 0 ? value.join(',') : null),
});
