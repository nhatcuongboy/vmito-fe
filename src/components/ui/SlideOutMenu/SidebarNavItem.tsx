'use client';

import { Flex, Text } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { VTooltip } from '@/components/ui/VTooltip';
import {
  ACTIVE_ICON_COLOR,
  TOOLTIP_OPEN_DELAY,
  TOOLTIP_POSITIONING,
  getActiveProps,
} from './nav-styles';

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  onClose,
}: SidebarNavItemProps) {
  const justifyContent = {
    base: 'flex-start',
    md: isCollapsed ? 'center' : 'flex-start',
  };

  return (
    <VTooltip
      content={label}
      positioning={TOOLTIP_POSITIONING}
      disabled={!isCollapsed}
      showArrow
      openDelay={TOOLTIP_OPEN_DELAY}
    >
      <NextLinkButton
        href={href}
        variant="ghost"
        justifyContent={justifyContent}
        onClick={onClose}
        w="full"
        px={{ base: 4, md: isCollapsed ? 0 : 4 }}
        {...getActiveProps(isActive, isCollapsed)}
      >
        <Flex align="center" gap={3} w="full" justifyContent={justifyContent}>
          <Icon
            size={18}
            color={isActive ? ACTIVE_ICON_COLOR : 'currentColor'}
          />
          {!isCollapsed && <Text>{label}</Text>}
        </Flex>
      </NextLinkButton>
    </VTooltip>
  );
}
