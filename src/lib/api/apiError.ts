import { AxiosError } from 'axios';
import { Locale } from '@/i18n/locales';
import { getCurrentLocale } from '@/lib/i18n/toastMessages';

export type ApiErrorKind = 'network' | 'server' | 'client';

const GENERIC_MESSAGES: Record<Locale, Record<ApiErrorKind, string>> = {
  [Locale.VI]: {
    network: 'Không thể kết nối, kiểm tra lại mạng và thử lại',
    server: 'Hệ thống đang gặp sự cố, vui lòng thử lại sau ít phút',
    client: 'Có lỗi xảy ra, vui lòng thử lại',
  },
  [Locale.EN]: {
    network: 'Unable to connect. Please check your network and try again',
    server: 'The system is having issues. Please try again in a few minutes',
    client: 'Something went wrong, please try again',
  },
  [Locale.CN]: {
    network: '无法连接，请检查网络后重试',
    server: '系统出现问题，请稍后重试',
    client: '发生错误，请重试',
  },
};

const isAxiosLikeError = (error: unknown): error is AxiosError =>
  !!error && typeof error === 'object' && 'isAxiosError' in error;

/**
 * Classify an API error so the UI can pick appropriate copy:
 * - network: request never got a response (offline, DNS, timeout)
 * - server: 5xx from backend or CDN (e.g. Cloudflare 502)
 * - client: 4xx — may carry an intentional user-facing message
 */
export const classifyApiError = (error: unknown): ApiErrorKind => {
  if (isAxiosLikeError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      return 'network';
    }
    const status = error.response?.status;
    if (!status) return 'network';
    if (status >= 500) return 'server';
    return 'client';
  }
  return 'client';
};

/**
 * Extract an intentional, human-readable message from a backend 4xx body
 * (NestJS returns `message` as a string or string[] for validation errors).
 * Returns null for anything else — raw bodies (e.g. Cloudflare
 * application/problem+json) must never reach the UI.
 */
const extractBackendMessage = (data: unknown): string | null => {
  if (typeof data === 'string' && data.trim()) return data;
  if (!data || typeof data !== 'object') return null;

  const raw = (data as { message?: unknown; error?: unknown }).message;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (
    Array.isArray(raw) &&
    raw.length > 0 &&
    raw.every((item) => typeof item === 'string')
  ) {
    return raw.join('\n');
  }
  return null;
};

/**
 * Short, locale-aware message safe to show to end users. Technical details
 * (status, ray_id, raw body) never end up here — see logApiError.
 */
export const getUserFacingErrorMessage = (
  error: unknown,
  locale?: Locale
): string => {
  const kind = classifyApiError(error);
  const resolvedLocale = locale ?? getCurrentLocale();

  if (kind === 'client' && isAxiosLikeError(error)) {
    const backendMessage = extractBackendMessage(error.response?.data);
    if (backendMessage) return backendMessage;
  }

  return GENERIC_MESSAGES[resolvedLocale][kind];
};

/** Full technical details for debugging — console only, never rendered. */
export const logApiError = (error: unknown): void => {
  if (isAxiosLikeError(error)) {
    const method = error.config?.method?.toUpperCase() ?? 'REQUEST';
    const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
    const status = error.response?.status ?? error.code ?? 'no response';
    console.error(
      `[API Error] ${method} ${url} → ${status}`,
      error.response?.data ?? error.message
    );
  } else {
    console.error('[API Error]', error);
  }
};
