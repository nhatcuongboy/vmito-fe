'use client';

import { ROUTES, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { usePathname } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { AppFixedLinkTabs } from '@/components/common/AppFixedLinkTabs';

export function MyClubsSectionTabs() {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  const normalizedPathname = pathname
    ?.replace(/^\/[a-z]{2}(\/|$)/, '/')
    .replace(/\/$/, '');

  const items = [
    {
      href: ROUTES.CLUBS.MANAGING,
      label: t('manageGroups'),
      isActive: normalizedPathname === '/my-clubs/managing',
    },
    {
      href: ROUTES.CLUBS.MEMBER,
      label: t('joinedGroups'),
      isActive: normalizedPathname === '/my-clubs/member',
    },
  ];

  return (
    <AppFixedLinkTabs
      items={items}
      ariaLabel={t('clubs')}
      top={TOP_BAR_HEIGHT_MOBILE}
    />
  );
}
