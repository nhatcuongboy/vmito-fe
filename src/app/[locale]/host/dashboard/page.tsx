'use client';

import { Suspense } from 'react';

import HostDashboard from '@/components/dashboard/HostDashboard';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import { UserRole } from '@/lib/api/types';
import { Box } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

function HostDashboardContent() {
  const t = useTranslations('pages.dashboard');

  return (
    <Box minH="100vh">
      <TopBar title={t('title')} />
      <HostDashboard />
    </Box>
  );
}
export default function HostDashboardPage() {
  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Suspense>
        <HostDashboardContent />
      </Suspense>
    </ProtectedRouteGuard>
  );
}
