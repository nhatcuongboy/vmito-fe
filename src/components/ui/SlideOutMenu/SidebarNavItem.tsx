'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/primitives/tooltip';
import { NotificationBadge } from '@/components/ui/NotificationBadge';
import { Link } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { Flame, type LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  showFlame?: boolean;
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
  badge,
  onClose,
}: SidebarNavItemProps) {
  const link = (
    <Link
      href={href}
      className={cn('sidebar-nav-link', isActive && 'is-active')}
      data-collapsed={isCollapsed ? 'true' : undefined}
      aria-label={label}
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
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
