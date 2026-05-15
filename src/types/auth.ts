// Auth types for Backend NestJS JWT authentication

import { UserRole } from '@/lib/api/types';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  image?: string | null;
  imagePublicId?: string | null;
  phone?: string | null;
  gender?: string | null;
  // Guest-specific fields
  playerId?: string;
  sessionId?: string;
  joinCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string | number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string | number;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
  locale?: string;
  redirectUrl: string;
}

export interface ForgotPasswordResponse {
  message?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message?: string;
}
