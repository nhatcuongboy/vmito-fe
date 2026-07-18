/**
 * View mode types + validation, shared between server and client.
 * Kept free of 'use client' so server components (e.g. the home page reading
 * the view-mode cookie) can call isValidViewMode directly — functions
 * exported from a client module become client references and throw when
 * invoked on the server.
 */
export type ViewMode = 'grid' | 'list' | 'map';

export function isValidViewMode(value: string): value is ViewMode {
  return value === 'grid' || value === 'list' || value === 'map';
}
