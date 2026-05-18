import axios from 'axios';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipGlobalError?: boolean;
    _retry?: boolean;
  }
}

// Get API URL from environment - use backend URL if set, otherwise fallback to /api for local
// In SSR (server side), we prefer INTERNAL_API_URL if defined to avoid DNS loopback issues
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const INTERNAL_API_URL = process.env.INTERNAL_API_URL;

const API_URL =
  typeof window === 'undefined' && INTERNAL_API_URL
    ? INTERNAL_API_URL
    : PUBLIC_API_URL;

if (typeof window === 'undefined') {
  console.log('[SSR] Using API Base URL:', API_URL);
  if (API_URL.includes('vmito.com')) {
    console.warn(
      '[SSR Warning] Server is calling a public URL. This often causes timeouts. Please set INTERNAL_API_URL environment variable to http://localhost:PORT/api'
    );
  }
}

// Axios instance with base configuration
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for better stability
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Only add token on client side
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors & token expiration
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorData = error.response?.data;
    let message = 'Something went wrong';

    if (errorData) {
      if (typeof errorData === 'string') {
        message = errorData;
      } else {
        // Handle common backend error formats (NestJS, etc.)
        const rawMessage =
          errorData.message ||
          errorData.error?.message ||
          errorData.error ||
          errorData.errors;

        if (Array.isArray(rawMessage)) {
          message = rawMessage.join('\n');
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        } else if (rawMessage && typeof rawMessage === 'object') {
          message = rawMessage.message || JSON.stringify(rawMessage);
        } else {
          message = JSON.stringify(errorData);
        }
      }
    } else if (error.message) {
      message = error.message;
    }

    // Check if this is an authentication request (login/register/refresh)
    // Must exclude /auth/refresh to prevent infinite retry loop when refresh token is expired
    const isAuthRequest =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/forgot-password') ||
      originalRequest.url?.includes('/auth/reset-password');

    // Handle 401 Unauthorized - Token expired or invalid
    if (
      status === 401 &&
      typeof window !== 'undefined' &&
      !originalRequest._retry &&
      !isAuthRequest // Don't try to refresh for login/register
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dynamically import AuthService to avoid circular dependency
        const { AuthService } = await import('./auth.service');
        const { accessToken } = await AuthService.refreshToken();

        processQueue(null, accessToken);

        // Update authorization header with new token
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // If refresh fails, clear auth and redirect
        const clearAuth = useAuthStore.getState().clearAuth;
        clearAuth();

        // Only show toast and redirect if not already on auth pages
        if (!window.location.pathname.includes('/auth/')) {
          toaster.error({ title: 'Session expired. Please login again.' });
          // Delay redirect to allow toast to show
          setTimeout(() => {
            window.location.href = '/auth/signin';
          }, 1000);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    } else {
      // For all other errors (or 401s that weren't caught as refreshable)
      const method = error.config?.method?.toUpperCase();

      // Only handle UI interactions on the client side
      if (typeof window !== 'undefined') {
        // For GET requests, show toaster to avoid interrupting user flow
        if (method === 'GET' && !error.config?.skipGlobalError) {
          toaster.error({ title: message });
        } else {
          // For mutations (POST, PUT, DELETE), show modal/toast to ensure user sees the error
          // Skip automatic error reporting for auth requests or requests that explicitly skip it
          if (!isAuthRequest && !error.config?.skipGlobalError) {
            useAppStore.getState().setError(message);
          }
        }
      } else {
        // Log to server console during SSR
        if (error.code === 'ECONNABORTED') {
          console.error(
            `[SSR API TIMEOUT] ${method} ${API_URL}${error.config?.url} exceeded ${error.config?.timeout}ms`
          );
        } else {
          console.error(
            `[SSR API Error] ${method} ${API_URL}${error.config?.url}: ${message}`
          );
        }
      }
    }

    return Promise.reject(error);
  }
);
