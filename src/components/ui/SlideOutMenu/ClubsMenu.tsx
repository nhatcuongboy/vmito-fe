'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/primitives/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/primitives/popover';
import { ROUTES } from '@/constants';
import { Link, usePathname } from '@/i18n/config';
import {
  ChevronDown,
  ClipboardList,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { NavItemComponentProps } from './nav-config';

const FLYOUT_CLOSE_DELAY_MS = 250;

interface ClubSubmenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

function ClubSubmenuLink({
  item,
  variant = 'inline',
  onClose,
}: {
  item: ClubSubmenuItem;
  variant?: 'inline' | 'flyout';
  onClose: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      prefetch={false}
      href={item.href}
      className="sidebar-session-link"
      data-variant={variant}
      data-active={item.isActive ? 'true' : undefined}
      aria-current={item.isActive ? 'page' : undefined}
      onClick={onClose}
    >
      <Icon size={variant === 'flyout' ? 16 : 15} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function ClubsMenu({
  isCollapsed,
  onClose,
}: NavItemComponentProps) {
  const nav = useTranslations('navigation');
  const pathname = usePathname();
  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
  const isManagingClubsActive = normalizedPathname.startsWith(
    ROUTES.CLUBS.MANAGING
  );
  const isMemberClubsActive = normalizedPathname.startsWith(
    ROUTES.CLUBS.MEMBER
  );
  const isMenuActive = isManagingClubsActive || isMemberClubsActive;
  const [isMenuOpen, setIsMenuOpen] = useState(isMenuActive);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isMenuActive) setIsMenuOpen(true);
  }, [isMenuActive]);

  useEffect(
    () => () => {
      if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    },
    []
  );

  const openFlyout = () => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    setIsFlyoutOpen(true);
  };

  const closeFlyout = () => {
    if (flyoutCloseTimer.current) clearTimeout(flyoutCloseTimer.current);
    flyoutCloseTimer.current = setTimeout(
      () => setIsFlyoutOpen(false),
      FLYOUT_CLOSE_DELAY_MS
    );
  };

  const submenuItems: ClubSubmenuItem[] = [
    {
      href: ROUTES.CLUBS.MANAGING,
      label: nav('manageGroups'),
      icon: ClipboardList,
      isActive: isManagingClubsActive,
    },
    {
      href: ROUTES.CLUBS.MEMBER,
      label: nav('joinedGroups'),
      icon: Ticket,
      isActive: isMemberClubsActive,
    },
  ];

  if (isCollapsed) {
    return (
      <div
        className="sidebar-sessions-collapsed"
        onPointerEnter={openFlyout}
        onPointerLeave={closeFlyout}
        onFocus={openFlyout}
      >
        <Popover open={isFlyoutOpen} onOpenChange={setIsFlyoutOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="sidebar-session-trigger is-collapsed"
              data-active={isMenuActive ? 'true' : undefined}
              aria-label={nav('myClubs')}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <Users size={18} />
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="sidebar-session-flyout"
            aria-label={nav('myClubs')}
            side="right"
            align="start"
            sideOffset={8}
            alignOffset={-4}
            onPointerEnter={openFlyout}
            onPointerLeave={closeFlyout}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <p className="sidebar-session-flyout-title">{nav('myClubs')}</p>
            <div className="sidebar-session-links">
              {submenuItems.map((item) => (
                <ClubSubmenuLink
                  key={item.href}
                  item={item}
                  variant="flyout"
                  onClose={onClose}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Collapsible
      className="sidebar-sessions-expanded"
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="sidebar-session-trigger"
          data-active={isMenuActive ? 'true' : undefined}
        >
          <span className="sidebar-nav-icon" aria-hidden="true">
            <Users size={18} />
          </span>
          <span className="sidebar-session-label">{nav('myClubs')}</span>
          <ChevronDown
            className="sidebar-session-chevron"
            data-open={isMenuOpen ? 'true' : undefined}
            size={16}
            aria-hidden="true"
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="sidebar-session-inline-links">
        <div className="sidebar-session-inline-links-inner">
          {submenuItems.map((item) => (
            <ClubSubmenuLink key={item.href} item={item} onClose={onClose} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
