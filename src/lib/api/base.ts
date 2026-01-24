import axios from 'axios';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';

// Get API URL from environment - use backend URL if set, otherwise fallback to /api for local
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Axios instance with base configuration
export const api = axios.create({
  baseURL: API_URL,
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
    let message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Something went wrong';

    if (typeof message !== 'string') {
      if (Array.isArray(message)) {
        message = message.join(', ');
      } else {
        message = JSON.stringify(message);
      }
    }

    // Handle 401 Unauthorized - Token expired or invalid
    if (status === 401 && typeof window !== 'undefined' && !originalRequest._retry) {
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
    } else if (status === 401) {
       // If 401 happens again (after retry) or during refresh, just reject
       return Promise.reject(error);
    } else {
      // Don't show toast for 401 errors (handled above)
      const method = error.config?.method?.toUpperCase();

      // For GET requests, show toaster to avoid interrupting user flow
      if (method === 'GET') {
        toaster.error({ title: message });
      } else {
        // For mutations (POST, PUT, DELETE), show modal to ensure user sees the error
        useAppStore.getState().setError(message);
      }
    }

    return Promise.reject(error);
  }
);
