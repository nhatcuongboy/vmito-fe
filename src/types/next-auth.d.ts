import type { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from '@/lib/api/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      playerId?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: UserRole;
    playerId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    playerId?: string;
  }
}
