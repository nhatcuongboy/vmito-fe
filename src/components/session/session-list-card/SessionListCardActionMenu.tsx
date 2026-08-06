'use client';

import type { LucideIcon } from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import {
  Icon,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
} from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';

export interface SessionListCardActionItem {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  color?: string;
  isDisabled?: boolean;
}

interface SessionListCardActionMenuProps {
  ariaLabel: string;
  items: SessionListCardActionItem[];
  isLoading?: boolean;
}

export const SessionListCardActionMenu = ({
  ariaLabel,
  items,
  isLoading = false,
}: SessionListCardActionMenuProps) => {
  if (items.length === 0) return null;

  return (
    <MenuRoot positioning={{ placement: 'bottom-end' }}>
      <MenuTrigger asChild>
        <IconButton
          size="sm"
          minW={{ base: '40px', md: '36px' }}
          minH={{ base: '40px', md: '36px' }}
          variant="outline"
          colorPalette="gray"
          aria-label={ariaLabel}
          loading={isLoading}
          icon={<Icon as={MoreVertical} boxSize={{ base: 4, md: 3.5 }} />}
          onClick={(event: React.MouseEvent) => event.stopPropagation()}
        />
      </MenuTrigger>
      <Portal>
        <MenuPositioner zIndex={2000}>
          <MenuContent
            bg="white"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            borderWidth="1px"
            borderColor="gray.200"
            boxShadow="lg"
            onClick={(event) => event.stopPropagation()}
          >
            {items.map((item) => (
              <MenuItem
                key={item.key}
                value={item.key}
                color={item.color}
                disabled={item.isDisabled}
                cursor="pointer"
                onClick={() => item.onSelect()}
              >
                <Icon as={item.icon} />
                {item.label}
              </MenuItem>
            ))}
          </MenuContent>
        </MenuPositioner>
      </Portal>
    </MenuRoot>
  );
};
