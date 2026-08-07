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
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import { Link, usePathname } from '@/i18n/config';
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { NavItemComponentProps } from './nav-config';

const FLYOUT_CLOSE_DELAY_MS = 250;

interface SessionSubmenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

function SessionSubmenuLink({
  item,
  variant = 'inline',
  onClose,
}: {
  item: SessionSubmenuItem;
  variant?: 'inline' | 'flyout';
  onClose: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
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

export default function SessionsMenu({
  isCollapsed,
  onClose,
}: NavItemComponentProps) {
  const nav = useTranslations('navigation');
  const { canAccessHostFeatures } = useCanAccessHostFeatures();
  const pathname = usePathname();
  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
  const manageSessionsHref = canAccessHostFeatures
    ? ROUTES.HOST.SESSIONS.LIST
    : ROUTES.PLAYER.HOST_FEATURE;
  const joinedSessionsHref = ROUTES.PLAYER.SESSIONS.LIST;
  const isSessionsParentActive = normalizedPathname.startsWith(
    ROUTES.HOST.SESSIONS.LIST
  );
  const isJoinedSessionsActive =
    normalizedPathname.startsWith(joinedSessionsHref);
  const isHostedSessionsActive =
    isSessionsParentActive && !isJoinedSessionsActive;
  const isMenuActive = isHostedSessionsActive || isJoinedSessionsActive;
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

  const submenuItems: SessionSubmenuItem[] = [
    {
      href: manageSessionsHref,
      label: nav('myHostedSessions'),
      icon: ClipboardList,
      isActive: isHostedSessionsActive,
    },
    {
      href: joinedSessionsHref,
      label: nav('joined'),
      icon: Ticket,
      isActive: isJoinedSessionsActive,
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
              aria-label={nav('sessions')}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <CalendarDays size={18} />
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="sidebar-session-flyout"
            aria-label={nav('sessions')}
            side="right"
            align="start"
            sideOffset={8}
            alignOffset={-4}
            onPointerEnter={openFlyout}
            onPointerLeave={closeFlyout}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <p className="sidebar-session-flyout-title">{nav('sessions')}</p>
            <div className="sidebar-session-links">
              {submenuItems.map((item) => (
                <SessionSubmenuLink
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
            <CalendarDays size={18} />
          </span>
          <span className="sidebar-session-label">{nav('sessions')}</span>
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
            <SessionSubmenuLink key={item.href} item={item} onClose={onClose} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
