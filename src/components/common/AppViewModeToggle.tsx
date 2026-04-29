'use client';

import { IconButton } from '@/components/ui/chakra-compat';
import { useViewModeStore } from '@/stores/useViewModeStore';
import { Flex } from '@chakra-ui/react';
import { LayoutGrid, List, MapPin } from 'lucide-react';

interface AppViewModeToggleProps {
  scope: string;
}

export default function AppViewModeToggle({ scope }: AppViewModeToggleProps) {
  const { getViewMode, setViewMode } = useViewModeStore();
  const viewMode = getViewMode(scope);

  return (
    <Flex
      gap={0.5}
      bg="white"
      borderRadius="lg"
      p={0.5}
      borderWidth="1px"
      borderColor="gray.200"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      shadow="sm"
      h="fit-content"
    >
      <IconButton
        size="xs"
        h="32px"
        w="32px"
        variant={viewMode === 'grid' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="Grid view"
        icon={<LayoutGrid size={16} />}
        onClick={() => setViewMode(scope, 'grid')}
        borderRadius="md"
      />
      <IconButton
        size="xs"
        h="32px"
        w="32px"
        variant={viewMode === 'list' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="List view"
        icon={<List size={16} />}
        onClick={() => setViewMode(scope, 'list')}
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
        onClick={() => setViewMode(scope, 'map')}
        borderRadius="md"
      />
    </Flex>
  );
}
