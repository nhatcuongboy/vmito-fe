'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/primitives/tooltip';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import BookingBetaBadge from '@/components/venue-rental/BookingBetaBadge';
import { Link } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { Flame, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  showFlame?: boolean;
  statusBadge?: 'beta';
  badge?: number;
  onClose: () => void;
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  showFlame,
  statusBadge,
  badge,
  onClose,
}: SidebarNavItemProps) {
  const common = useTranslations('common');
  const accessibleLabel =
    statusBadge === 'beta' ? `${label} · ${common('beta')}` : label;
  const link = (
    <Link
      prefetch={false}
      href={href}
      className={cn('sidebar-nav-link', isActive && 'is-active')}
      data-collapsed={isCollapsed ? 'true' : undefined}
      aria-label={accessibleLabel}
      aria-current={isActive ? 'page' : undefined}
      onClick={onClose}
    >
      <span
        className="sidebar-nav-icon"
        aria-hidden="true"
        style={{ position: 'relative' }}
      >
        <Icon size={18} />
        {badge !== undefined && badge > 0 && (
          <NotificationBadge
            count={badge}
            size="sm"
            aria-label={`${badge} new`}
          />
        )}
      </span>
      <span className="sidebar-nav-label">{label}</span>
      {statusBadge === 'beta' && !isCollapsed ? <BookingBetaBadge /> : null}
      {showFlame && !isCollapsed ? (
        <Flame
          className="sidebar-nav-flame"
          size={17}
          fill="currentColor"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );

  if (!isCollapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {accessibleLabel}
      </TooltipContent>
    </Tooltip>
  );
}
