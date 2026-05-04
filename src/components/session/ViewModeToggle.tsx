'use client';

import { useEffect } from 'react';
import { IconButton } from '@/components/ui/chakra-compat';
import { Flex } from '@chakra-ui/react';
import { LayoutGrid, List, MapPin } from 'lucide-react';
import { ViewMode } from '@/hooks/useViewMode';

interface ViewModeToggleProps {
  showMap?: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export default function ViewModeToggle({
  showMap = true,
  viewMode,
  setViewMode,
}: ViewModeToggleProps) {
  useEffect(() => {
    if (!showMap && viewMode === 'map') {
      setViewMode('grid');
    }
  }, [showMap, viewMode, setViewMode]);

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
        variant={viewMode === 'grid' ? 'solid' : 'ghost'}
        colorPalette="green"
        aria-label="Grid view"
        icon={<LayoutGrid size={16} />}
        onClick={() => setViewMode('grid')}
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
        onClick={() => setViewMode('list')}
        borderRadius="md"
      />
      {showMap && (
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
      )}
    </Flex>
  );
}
