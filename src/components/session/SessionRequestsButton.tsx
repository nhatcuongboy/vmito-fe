'use client';

import { Button } from '@/components/ui/chakra-compat';
import { Badge, Box } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface SessionRequestsButtonProps {
  label: string;
  icon: LucideIcon;
  count?: number;
  onClick: () => void;
}

export function SessionRequestsButton({
  label,
  icon: Icon,
  count,
  onClick,
}: SessionRequestsButtonProps) {
  return (
    <Box position="relative">
      <Button
        size="sm"
        variant="outline"
        aria-label={label}
        title={label}
        onClick={onClick}
        h="32px"
        minW="32px"
        px={2}
        borderRadius="full"
        bg={{ base: 'white', _dark: 'gray.800' }}
      >
        <Icon size={16} aria-hidden="true" />
      </Button>
      {count && count > 0 ? (
        <Badge
          position="absolute"
          top="-7px"
          right="-7px"
          minW="18px"
          h="18px"
          px={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
          colorPalette="red"
          variant="solid"
          fontSize="2xs"
          pointerEvents="none"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      ) : null}
    </Box>
  );
}
