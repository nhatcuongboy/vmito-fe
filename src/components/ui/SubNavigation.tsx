'use client';

import { Link } from '@/i18n/config';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export interface NavItem {
  label: string;
  href: string;
}

interface SubNavigationProps {
  items: NavItem[];
}

export default function SubNavigation({ items }: SubNavigationProps) {
  const pathname = usePathname();
  const common = useTranslations('common');
  const normalizedPathname = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');

  return (
    <nav className="top-bar-subnav" aria-label={common('navigation')}>
      <div className="top-bar-subnav-list">
        {items.map((item) => {
          const normalizedHref = item.href.replace(/^\/[a-z]{2}(\/|$)/, '/');
          const isActive =
            normalizedHref === '/'
              ? normalizedPathname === '/'
              : normalizedPathname === normalizedHref ||
                normalizedPathname.startsWith(`${normalizedHref}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="top-bar-subnav-link"
              data-active={isActive ? 'true' : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
