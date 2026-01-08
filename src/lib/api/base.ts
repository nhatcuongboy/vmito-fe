import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/useAuthStore';

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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Something went wrong';

    // Handle 401 Unauthorized - Token expired or invalid
    if (status === 401 && typeof window !== 'undefined') {
      const clearAuth = useAuthStore.getState().clearAuth;
      clearAuth();

      // Only show toast and redirect if not already on auth pages
      if (!window.location.pathname.includes('/auth/')) {
        toast.error('Session expired. Please login again.');
        // Delay redirect to allow toast to show
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 1000);
      }
    } else if (status !== 401) {
      // Don't show toast for 401 errors (handled above)
      toast.error(message);
    }

    return Promise.reject(error);
  }
);
