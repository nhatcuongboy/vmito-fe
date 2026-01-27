'use client';

import { Suspense } from 'react';

import HostDashboard from '@/components/dashboard/HostDashboard';
import PlayerDashboard from '@/components/dashboard/PlayerDashboard';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import { UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { Box } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

function DashboardContent() {
  const t = useTranslations('pages.dashboard');
  const { user } = useAuthStore();

  return (
    <Box minH="100vh">
      {/* Top Bar */}
      <TopBar title={t('title')} />
      {user?.role === UserRole.HOST || user?.role === UserRole.ADMIN ? (
        <HostDashboard />
      ) : (
        <PlayerDashboard />
      )}
    </Box>
  );
}
export default function DashboardPage() {
  return (
    <ProtectedRouteGuard>
      <Suspense>
        <DashboardContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
