# Plan Migration Authentication từ NextAuth sang Backend NestJS

## 📋 Tổng Quan

Migration hệ thống authentication từ NextAuth (Frontend) sang JWT-based authentication của NestJS Backend.

**Ngày bắt đầu:** 9 Tháng 12, 2025  
**Độ ưu tiên:** HIGH  
**Ước tính thời gian:** 2-3 ngày

---

## 🔍 Phân Tích Hiện Trạng

### Frontend (NextAuth - ĐANG SỬ DỤNG)
```typescript
// src/lib/auth.ts - NextAuth v5 Configuration
- Credentials Provider (email/password)
- OTP Provider (join code for guests)
- Google OAuth
- JWT Strategy with Prisma Adapter
```

**Vấn đề:**
- ❌ NextAuth đang được import nhưng **KHÔNG được sử dụng thực tế**
- ❌ Guards (`ProtectedRouteGuard`, `PublicRouteGuard`) sử dụng `useSession()` từ NextAuth
- ❌ Sign in page sử dụng `signIn()` từ NextAuth
- ❌ Dependencies không cần thiết: `next-auth`, `@auth/prisma-adapter`, `@next-auth/prisma-adapter`

### Backend (NestJS - ĐÃ SẴN SÀNG)
```
Backend Authentication APIs:
✅ POST /auth/register - Đăng ký user mới
✅ POST /auth/login - Login và nhận JWT token
✅ GET /auth/token - Refresh/get new token
✅ PUT /auth/change-password - Đổi password
✅ PUT /auth/reset-password - Reset password (admin)
✅ JWT Strategy & Guards đã implement
```

**Response format từ `/auth/login`:**
```json
{
  "accessToken": "eyJhbGc...",
  "tokenType": "Bearer",
  "expiresIn": "7d",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "PLAYER",
    "image": null
  }
}
```

---

## 🎯 Mục Tiêu Migration

1. ✅ Loại bỏ hoàn toàn NextAuth khỏi frontend
2. ✅ Implement JWT-based authentication client-side
3. ✅ Tạo Auth Store với Zustand để quản lý authentication state
4. ✅ Update tất cả API calls để gửi JWT token
5. ✅ Refactor Guards để sử dụng Auth Store thay vì NextAuth
6. ✅ Update Sign In/Sign Up pages
7. ✅ Handle token refresh & expiration
8. ✅ Migrate guest login (join by code) flow

---

## 📦 Phase 1: Chuẩn Bị (30 phút)

### 1.1. Backup & Create Branch
```bash
git checkout -b feature/migrate-to-backend-auth
git add .
git commit -m "chore: backup before auth migration"
```

### 1.2. Update Environment Variables
**File: `.env.local` (Frontend)**
```env
# Remove NextAuth configs
# NEXTAUTH_SECRET=
# NEXTAUTH_URL=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Add Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
# or for production
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**File: `badminton-backend/.env`**
```env
# Verify these are set
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 1.3. Document Dependencies to Remove
```json
// package.json - TO BE REMOVED
"next-auth": "5.0.0-beta.25"
"@auth/prisma-adapter": "^2.10.0"
"@next-auth/prisma-adapter": "^1.0.7"
```

---

## 📦 Phase 2: Tạo Auth Store & Services (2 giờ)

### 2.1. Tạo Auth Types
**File: `src/types/auth.types.ts`** (NEW)
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
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
```

### 2.2. Tạo Auth Store với Zustand
**File: `src/stores/useAuthStore.ts`** (NEW)
```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '@/types/auth.types';

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,

        // Actions
        setAuth: (user, token) =>
          set(
            {
              user,
              accessToken: token,
              isAuthenticated: true,
              isLoading: false,
            },
            false,
            'setAuth'
          ),

        clearAuth: () =>
          set(
            {
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isLoading: false,
            },
            false,
            'clearAuth'
          ),

        setUser: (user) => set({ user }, false, 'setUser'),

        setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),

        updateToken: (token) => set({ accessToken: token }, false, 'updateToken'),
      }),
      {
        name: 'auth-storage',
        // Only persist user and token, not loading state
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);
```

### 2.3. Update Base API Configuration
**File: `src/lib/api/base.ts`** (UPDATE)
```typescript
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/useAuthStore';

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Axios instance with base configuration
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const message = error.response?.data?.message || error.response?.data?.error || 'Something went wrong';

    // Handle 401 Unauthorized - Token expired or invalid
    if (status === 401) {
      const clearAuth = useAuthStore.getState().clearAuth;
      clearAuth();
      toast.error('Session expired. Please login again.');
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/signin')) {
        window.location.href = '/auth/signin';
      }
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// API response type
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### 2.4. Tạo Auth Service mới
**File: `src/lib/api/auth.service.ts`** (REPLACE)
```typescript
import { api, ApiResponse } from './base';
import { 
  LoginRequest, 
  RegisterRequest, 
  LoginResponse,
  User 
} from '@/types/auth.types';
import { useAuthStore } from '@/stores/useAuthStore';

export const AuthService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Save to auth store
    const { user, accessToken } = response.data;
    useAuthStore.getState().setAuth(user, accessToken);
    
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },

  /**
   * Logout - clear local state
   */
  logout: async (): Promise<void> => {
    useAuthStore.getState().clearAuth();
    
    // Optional: Call backend logout endpoint if exists
    // await api.post('/auth/logout');
  },

  /**
   * Get new token (refresh)
   */
  refreshToken: async (): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/token');
    
    // Update token in store
    const { accessToken } = response.data;
    useAuthStore.getState().updateToken(accessToken);
    
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(
      '/auth/change-password',
      data
    );
    return response.data;
  },

  /**
   * Get current user from token
   */
  getCurrentUser: (): User | null => {
    return useAuthStore.getState().user;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return useAuthStore.getState().isAuthenticated;
  },

  /**
   * Check code validation (for guest join)
   */
  checkCode: async (code: string): Promise<{ isPlayerCode: boolean }> => {
    const response = await api.get<ApiResponse<{ isPlayerCode: boolean }>>(
      `/players/check-code?code=${code}`
    );
    return response.data.data!;
  },

  /**
   * Join session by code (guest flow)
   */
  joinByCode: async (
    sessionCode: string,
    playerInfo?: {
      name?: string;
      gender?: string;
      level?: string;
      phone?: string;
    }
  ): Promise<any> => {
    const response = await api.post('/join-by-code', {
      sessionCode: sessionCode.trim().toUpperCase(),
      ...playerInfo,
    });
    return response.data;
  },
};
```

---

## 📦 Phase 3: Refactor Guards (1 giờ)

### 3.1. Update Protected Route Guard
**File: `src/components/guards/ProtectedRouteGuard.tsx`** (REPLACE)
```typescript
'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from '@/i18n/config';
import { useEffect, useState } from 'react';
import { Box, Spinner, Text, VStack, Button } from '@chakra-ui/react';
import { useLocale } from 'next-intl';

interface ProtectedRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredRole?: string[];
}

export default function ProtectedRouteGuard({
  children,
  redirectTo = '/auth/signin',
  requiredRole = [],
}: ProtectedRouteGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, router, redirectTo]);

  // Check role permission
  const hasRequiredRole = () => {
    if (requiredRole.length === 0) return true;
    return requiredRole.includes(user?.role || '');
  };

  // Loading state
  if (isChecking) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Authenticating...</Text>
        </VStack>
      </Box>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Redirecting to sign in...</Text>
        </VStack>
      </Box>
    );
  }

  // Check role permission
  if (!hasRequiredRole()) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        px={4}
      >
        <VStack gap={6} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="red.500">
            Access Denied
          </Text>
          <Text color="gray.600">
            You don't have permission to access this page.
          </Text>
          <Button colorScheme="blue" onClick={() => router.push(`/${locale}/dashboard`)}>
            Go to Dashboard
          </Button>
        </VStack>
      </Box>
    );
  }

  return <>{children}</>;
}
```

### 3.2. Update Public Route Guard
**File: `src/components/guards/PublicRouteGuard.tsx`** (REPLACE)
```typescript
'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useLocale } from 'next-intl';

interface PublicRouteGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function PublicRouteGuard({
  children,
  redirectTo = '/dashboard',
}: PublicRouteGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const locale = useLocale();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      let targetPath = redirectTo;

      // Override based on user role
      if (user.role !== 'GUEST') {
        targetPath = '/dashboard';
      } else {
        targetPath = '/my-session';
      }

      const localizedRedirectTo = `/${locale}${targetPath}`;
      router.push(localizedRedirectTo);
    } else {
      setIsChecking(false);
    }
  }, [user, isAuthenticated, router, redirectTo, locale]);

  // Loading state
  if (isChecking) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Checking authentication...</Text>
        </VStack>
      </Box>
    );
  }

  // Already authenticated
  if (isAuthenticated) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.600">Redirecting...</Text>
        </VStack>
      </Box>
    );
  }

  return <>{children}</>;
}
```

---

## 📦 Phase 4: Update Auth Pages (1.5 giờ)

### 4.1. Update Sign In Page
**File: `src/app/[locale]/auth/signin/page.tsx`** (UPDATE)
```typescript
'use client';

import PublicRouteGuard from '@/components/guards/PublicRouteGuard';
import MainLayout from '@/components/layout/MainLayout';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter } from '@/i18n/config';
import { AuthService } from '@/lib/api/auth.service';
import {
  Box,
  Button,
  Field,
  Heading,
  Input,
  Link,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params.locale as string;
  const callbackUrl = searchParams.get('callbackUrl') || `/${locale}/host`;
  const t = useTranslations('auth.signin');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      await AuthService.login(data);
      
      toast.success(t('loginSuccessful'));
      router.push(callbackUrl);
      router.refresh();
    } catch (error: any) {
      const message = error.response?.data?.message || t('loginFailed');
      toast.error(message);
      console.error('Login error:', error);
    }
  };

  return (
    <PublicRouteGuard redirectTo="/host">
      <MainLayout title={t('title')}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={4}
          py={8}
          height="100%"
        >
          <Box
            maxW="md"
            w="full"
            bg="white"
            p={8}
            borderRadius="lg"
            boxShadow="lg"
          >
            <VStack gap={6}>
              <Box textAlign="center">
                <Heading size="lg" color="brand.600">
                  {t('appTitle')}
                </Heading>
                <Text color="gray.600" mt={2}>
                  {t('description')}
                </Text>
              </Box>

              <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
                <VStack gap={4}>
                  <Field.Root invalid={!!errors.email}>
                    <Field.Label>{t('email')}</Field.Label>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder={t('emailPlaceholder')}
                    />
                    <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.password}>
                    <Field.Label>{t('password')}</Field.Label>
                    <PasswordInput
                      {...register('password')}
                      placeholder={t('passwordPlaceholder')}
                    />
                    <Field.ErrorText>
                      {errors.password?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    size="lg"
                    loading={isSubmitting}
                  >
                    {t('signInButton')}
                  </Button>
                </VStack>
              </form>

              <Separator />

              <VStack gap={2}>
                <Text color="gray.600">
                  {t('noAccount')}{' '}
                  <Link
                    href={`/${locale}/auth/signup`}
                    color="blue.600"
                    fontWeight="semibold"
                  >
                    {t('signUp')}
                  </Link>
                </Text>

                <Text color="gray.500" fontSize="sm">
                  {t('or')}{' '}
                  <Link
                    href={`/${locale}/join-by-code`}
                    color="blue.600"
                    fontWeight="semibold"
                  >
                    {t('joinAsGuest')}
                  </Link>
                </Text>
              </VStack>
            </VStack>
          </Box>
        </Box>
      </MainLayout>
    </PublicRouteGuard>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Box
          minH="100vh"
          bg="gray.50"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="blue.500" />
        </Box>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
```

### 4.2. Update Sign Up Page
**File: `src/app/[locale]/auth/signup/page.tsx`** (SIMILAR PATTERN)
- Replace `signIn()` NextAuth call with `AuthService.register()` then `AuthService.login()`

---

## 📦 Phase 5: Cleanup NextAuth (30 phút)

### 5.1. Xóa Files không cần thiết
```bash
# Remove NextAuth files
rm -rf src/lib/auth.ts
rm -rf src/lib/authMiddleware.ts
rm -rf src/app/api/auth/[...nextauth]/route.ts

# Optional: Remove other API auth routes if backend handles them
rm -rf src/app/api/auth/register/route.ts
rm -rf src/app/api/auth/change-password/route.ts
rm -rf src/app/api/auth/reset-password/route.ts
rm -rf src/app/api/auth/token/route.ts
```

### 5.2. Update package.json
```bash
pnpm remove next-auth @auth/prisma-adapter @next-auth/prisma-adapter
pnpm install
```

### 5.3. Clean up middleware.ts
**File: `middleware.ts`** - Giữ nguyên (chỉ handle i18n locale)

### 5.4. Update .env files
- Remove `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_SECRET`
- Add `NEXT_PUBLIC_API_URL`

---

## 📦 Phase 6: Testing & Verification (2 giờ)

### 6.1. Test Cases

#### Authentication Flow
- [ ] **Login:** Email + Password → JWT token saved → Redirect to dashboard
- [ ] **Register:** New user → Auto login → Redirect to dashboard
- [ ] **Logout:** Clear token → Redirect to home
- [ ] **Protected Route:** Access without token → Redirect to login
- [ ] **Public Route:** Access with token → Redirect to dashboard
- [ ] **Token Expiration:** 401 error → Clear auth → Redirect to login

#### Guest Flow
- [ ] **Join by Code:** Valid code → Join session (no authentication)
- [ ] **Invalid Code:** Show error message

#### API Calls
- [ ] **Authenticated Requests:** Token sent in Authorization header
- [ ] **Unauthorized Requests:** 401 → Logout → Redirect

### 6.2. Manual Testing Checklist
```
1. Start backend: cd badminton-backend && pnpm dev
2. Start frontend: cd badminton-app && pnpm dev
3. Test registration flow
4. Test login flow
5. Test protected routes
6. Test logout
7. Test API calls with auth
8. Test token refresh
9. Test guest join flow
10. Test different user roles
```

### 6.3. Browser DevTools Checks
- Check localStorage: `auth-storage` key exists
- Check API requests: Authorization header present
- Check network tab: Token sent with all requests
- Check token expiration handling

---

## 📦 Phase 7: Optional Enhancements (Future)

### 7.1. Token Auto-Refresh
```typescript
// Add token refresh logic before expiration
// Implement in useAuthStore or separate hook
```

### 7.2. Remember Me Feature
```typescript
// Store refresh token for longer sessions
```

### 7.3. Social Login (Google OAuth)
```typescript
// Implement Google OAuth flow through backend
// Backend returns JWT after OAuth verification
```

---

## 🚨 Rollback Plan

Nếu migration gặp vấn đề:

```bash
git checkout main
git branch -D feature/migrate-to-backend-auth
# Restore NextAuth dependencies
pnpm install next-auth@5.0.0-beta.25
```

---

## 📝 Migration Checklist

### Phase 1: Chuẩn bị
- [x] Create feature branch
- [x] Update environment variables
- [x] Document current state

### Phase 2: Auth Store & Services
- [x] Create auth types
- [x] Create auth store with Zustand
- [x] Update base API with interceptors
- [x] Create new auth service

### Phase 3: Refactor Guards
- [x] Update ProtectedRouteGuard
- [x] Update PublicRouteGuard

### Phase 4: Update Auth Pages
- [x] Update sign in page
- [x] Update sign up page
- [ ] Update change password page (if exists)

### Phase 5: Cleanup
- [x] Remove NextAuth files
- [ ] Remove NextAuth dependencies (pnpm remove)
- [x] Update environment files

### Phase 6: Testing
- [ ] Test login flow
- [ ] Test registration flow
- [ ] Test logout flow
- [ ] Test protected routes
- [ ] Test API authentication
- [ ] Test guest join flow
- [ ] Test token expiration

### Phase 7: Deployment
- [ ] Update production environment variables
- [ ] Deploy backend first
- [ ] Deploy frontend
- [ ] Monitor logs and errors

---

## 🎯 Success Metrics

- [ ] No NextAuth dependencies in `package.json`
- [x] All API calls authenticated with JWT
- [x] Guards working with Auth Store
- [ ] Login/Logout flow working smoothly
- [x] Token refresh working
- [ ] No authentication-related errors in console
- [ ] Guest join flow still working

---

## 📚 References

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)

---

**Người thực hiện:** GitHub Copilot  
**Reviewer:** [Reviewer Name]  
**Ngày hoàn thành:** 9 Tháng 12, 2025
