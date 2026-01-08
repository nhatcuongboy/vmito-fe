// Auth types for Backend NestJS JWT authentication

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'HOST' | 'PLAYER' | 'ADMIN' | 'GUEST';
  image?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: string | number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
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
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string | number;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  adminKey: string;
}
