'use client';

import { ROUTES, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { usePathname } from '@/i18n/config';
import { useTranslations } from 'next-intl';
import { AppFixedLinkTabs } from '@/components/common/AppFixedLinkTabs';

export function HostSessionsSectionTabs() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const joinedHref = ROUTES.PLAYER.SESSIONS.LIST;
  const items = [
    {
      href: ROUTES.HOST.SESSIONS.LIST,
      label: t('myHostedSessions'),
      isActive: !pathname.startsWith(joinedHref),
    },
    {
      href: joinedHref,
      label: t('joined'),
      isActive: pathname.startsWith(joinedHref),
    },
  ];

  return (
    <AppFixedLinkTabs
      items={items}
      ariaLabel={t('sessions')}
      top={TOP_BAR_HEIGHT_MOBILE}
    />
  );
}
