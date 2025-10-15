'use client';

import HostDashboard from '@/components/dashboard/HostDashboard';
import PlayerDashboard from '@/components/dashboard/PlayerDashboard';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import { UserRole } from '@/lib/api/types';
import { Box } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('pages.dashboard');
  const { data: session } = useSession();

  return (
    <ProtectedRouteGuard>
      <Box minH="100vh">
        {/* Top Bar */}
        <TopBar title={t('title')} />
        {session?.user.role === UserRole.HOST ? (
          <HostDashboard />
        ) : (
          <PlayerDashboard />
        )}
      </Box>
    </ProtectedRouteGuard>
  );
}
