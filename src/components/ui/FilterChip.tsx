'use client';

import { Badge, Box } from '@chakra-ui/react';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface FilterChipProps {
  label: string;
  colorPalette: string;
  onRemove: () => void;
  icon?: ReactNode;
}

export function FilterChip({
  label,
  colorPalette,
  onRemove,
  icon,
}: FilterChipProps) {
  return (
    <Badge
      colorPalette={colorPalette}
      variant="subtle"
      borderRadius="full"
      px={3}
      py={1}
      fontSize="xs"
      fontWeight="semibold"
      display="flex"
      alignItems="center"
      gap={1.5}
    >
      {icon}
      {label}
      <Box
        as="span"
        cursor="pointer"
        display="inline-flex"
        alignItems="center"
        onClick={onRemove}
        _hover={{ color: `${colorPalette}.700` }}
      >
        <X size={12} />
      </Box>
    </Badge>
  );
}
