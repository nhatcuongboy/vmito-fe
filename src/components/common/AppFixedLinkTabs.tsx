'use client';

import { Link } from '@/i18n/config';
import type { CSSProperties } from 'react';

export interface IAppFixedLinkTabsItem {
  href: string;
  label: string;
  isActive: boolean;
}

interface IAppFixedLinkTabsProps {
  items: IAppFixedLinkTabsItem[];
  ariaLabel: string;
  /** Distance (px) from the viewport top, usually the top bar height. */
  top: number;
}

// Mobile-only, full-width, fixed underline tab bar for navigating between sibling routes.
export function AppFixedLinkTabs({
  items,
  ariaLabel,
  top,
}: IAppFixedLinkTabsProps) {
  const style: CSSProperties & Record<`--${string}`, string | number> = {
    '--app-fixed-link-tabs-top': `${top}px`,
  };

  return (
    <nav className="app-fixed-link-tabs" style={style} aria-label={ariaLabel}>
      <div className="app-fixed-link-tabs-list">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="app-fixed-link-tab"
            data-active={item.isActive ? 'true' : undefined}
            aria-current={item.isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
