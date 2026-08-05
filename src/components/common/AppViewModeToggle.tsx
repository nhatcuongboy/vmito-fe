'use client';

import { IconButton } from '@/components/ui/chakra-compat';
import { useViewMode, type ViewMode } from '@/hooks/useViewMode';
import { Flex } from '@chakra-ui/react';
import { LayoutGrid, List, MapPin } from 'lucide-react';

interface AppViewModeToggleProps {
  scope: string;
  defaultMode?: ViewMode;
  /** Saved request-cookie preference supplied by a server component. */
  serverViewMode?: ViewMode;
  /** Render the List button before the Grid button. Defaults to Grid first. */
  listFirst?: boolean;
}

export default function AppViewModeToggle({
  scope,
  defaultMode = 'grid',
  serverViewMode,
  listFirst = false,
}: AppViewModeToggleProps) {
  const [viewMode, setViewMode] = useViewMode(
    scope,
    defaultMode,
    serverViewMode
  );

  const gridButton = (
    <IconButton
      key="grid"
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
  );

  const listButton = (
    <IconButton
      key="list"
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
  );

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
      {listFirst ? (
        <>
          {listButton}
          {gridButton}
        </>
      ) : (
        <>
          {gridButton}
          {listButton}
        </>
      )}
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
