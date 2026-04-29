'use client';

import { IconButton } from '@/components/ui/chakra-compat';
import { useSessionFilterStore } from '@/stores/useSessionFilterStore';
import { Flex } from '@chakra-ui/react';
import { LayoutGrid, List, MapPin } from 'lucide-react';

export default function ViewModeToggle() {
  const { viewMode, setViewMode } = useSessionFilterStore();

  return (
    <Flex
      gap={0.5}
      bg="white"
      borderRadius="lg"
      p={0.5}
      borderWidth="1px"
      borderColor={{ base: 'gray.300', _dark: 'gray.600' }}
      _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
      shadow="sm"
    >
      <IconButton
        size="xs"
        h="32px"
        w="32px"
        variant={viewMode === 'full' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="Full view"
        icon={<LayoutGrid size={16} />}
        onClick={() => setViewMode('full')}
        borderRadius="md"
      />
      <IconButton
        size="xs"
        h="32px"
        w="32px"
        variant={viewMode === 'compact' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="Compact view"
        icon={<List size={16} />}
        onClick={() => setViewMode('compact')}
        borderRadius="md"
      />
      <IconButton
        size="xs"
        h="32px"
        w="32px"
        variant={viewMode === 'map' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="Map view"
        icon={<MapPin size={16} />}
        onClick={() => setViewMode('map')}
        borderRadius="md"
      />
    </Flex>
  );
}
