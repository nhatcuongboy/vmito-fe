'use client';

import PlayerDashboard from '@/components/dashboard/PlayerDashboard';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import { UserRole } from '@/lib/api/types';
import { Box } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function PlayerDashboardPage() {
  const t = useTranslations('pages.dashboard');

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.PLAYER]}>
      <Box minH="100vh">
        <TopBar title={t('title')} />
        <PlayerDashboard />
      </Box>
    </ProtectedRouteGuard>
  );
}
