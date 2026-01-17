'use client';

import HostDashboard from '@/components/dashboard/HostDashboard';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import { UserRole } from '@/lib/api/types';
import { Box } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

export default function HostDashboardPage() {
  const t = useTranslations('pages.dashboard');

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Box minH="100vh">
        <TopBar title={t('title')} />
        <HostDashboard />
      </Box>
    </ProtectedRouteGuard>
  );
}
