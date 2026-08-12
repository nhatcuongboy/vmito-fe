'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/config';
import { MyClubsSectionTabs } from '@/components/clubs/MyClubsSectionTabs';

export default function MyClubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  const normalizedPathname = pathname
    ?.replace(/^\/[a-z]{2}(\/|$)/, '/')
    .replace(/\/$/, '');
  const activeTab =
    normalizedPathname === '/my-clubs/member' ? 'member' : 'managing';

  return (
    <PageLayout
      title={activeTab === 'member' ? t('joinedGroups') : t('manageGroups')}
      showBackButton={false}
      centerTitle
      subHeader={<MyClubsSectionTabs />}
      mobileSubHeaderOffset="60px"
    >
      {children}
    </PageLayout>
  );
}
