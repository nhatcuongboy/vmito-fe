'use client';

import { IconButton } from '@/components/ui/chakra-compat';
import { useSessionFilterStore } from '@/stores/useSessionFilterStore';
import { Flex } from '@chakra-ui/react';
import { LayoutGrid, List } from 'lucide-react';

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useSessionFilterStore();

  return (
    <Flex
      gap={1}
      bg="gray.100"
      _dark={{ bg: 'gray.700' }}
      borderRadius="md"
      p={0.5}
    >
      <IconButton
        size="sm"
        h="40px"
        w="40px"
        variant={viewMode === 'full' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="Full view"
        icon={<LayoutGrid size={18} />}
        onClick={() => setViewMode('full')}
        borderRadius="md"
      />
      <IconButton
        size="sm"
        h="40px"
        w="40px"
        variant={viewMode === 'compact' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="Compact view"
        icon={<List size={18} />}
        onClick={() => setViewMode('compact')}
        borderRadius="md"
      />
    </Flex>
  );
}
