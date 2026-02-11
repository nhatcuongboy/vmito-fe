'use client';

import { Suspense } from 'react';

import HostDashboard from '@/components/dashboard/HostDashboard';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import PageLayout from '@/components/layout/PageLayout';
import { UserRole } from '@/lib/api/types';
import { useTranslations } from 'next-intl';

function HostDashboardContent() {
  const t = useTranslations('pages.dashboard');

  return (
    <PageLayout title={t('title')}>
      <HostDashboard />
    </PageLayout>
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
