'use client';

import { Suspense } from 'react';

import HostDashboard from '@/components/dashboard/HostDashboard';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import TopBar from '@/components/ui/TopBar';
import PageWrapper from '@/components/layout/PageWrapper';
import { UserRole } from '@/lib/api/types';
import { useTranslations } from 'next-intl';

function HostDashboardContent() {
  const t = useTranslations('pages.dashboard');

  return (
    <PageWrapper>
      <TopBar title={t('title')} />
      <HostDashboard />
    </PageWrapper>
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
