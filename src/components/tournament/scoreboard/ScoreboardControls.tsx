'use client';

import { Flex, Text, Box } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Maximize, Minimize, Share2, Users, Wifi, WifiOff } from 'lucide-react';
import { TournamentCourt } from '@/lib/api/types';

interface Props {
  courts: TournamentCourt[];
  selectedCourtIds: string[];
  gridSize: 1 | 2 | 4 | 6;
  showFullNames: boolean;
  isFullscreen: boolean;
  isConnected: boolean;
  onToggleCourt: (id: string) => void;
  onClearCourts: () => void;
  onGridSize: (n: 1 | 2 | 4 | 6) => void;
  onShowFullNames: (show: boolean) => void;
  onToggleFullscreen: () => void;
  onShare: () => void;
}

const GRID_OPTIONS: Array<1 | 2 | 4 | 6> = [1, 2, 4, 6];

export default function ScoreboardControls({
  courts,
  selectedCourtIds,
  gridSize,
  showFullNames,
  isFullscreen,
  isConnected,
  onToggleCourt,
  onClearCourts,
  onGridSize,
  onShowFullNames,
  onToggleFullscreen,
  onShare,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreboard');
  const allSelected = selectedCourtIds.length === 0;

  return (
    <Flex
      align="center"
      gap={4}
      px={4}
      py={3}
      bg="gray.900"
      borderBottomWidth="1px"
      borderColor="gray.800"
      wrap="wrap"
    >
      {/* Court filter */}
      <Flex align="center" gap={2} wrap="wrap">
        <Text fontSize="sm" color="gray.400">
          {t('selectCourts')}:
        </Text>
        <ChipButton active={allSelected} onClick={onClearCourts}>
          {t('allCourts')}
        </ChipButton>
        {courts.map((court) => (
          <ChipButton
            key={court.id}
            active={selectedCourtIds.includes(court.id)}
            onClick={() => onToggleCourt(court.id)}
          >
            {t('court')} {court.courtNumber}
          </ChipButton>
        ))}
      </Flex>

      <Box flex="1" />

      {/* Grid size */}
      <Flex align="center" gap={2}>
        <Text fontSize="sm" color="gray.400">
          {t('gridSize')}:
        </Text>
        {GRID_OPTIONS.map((n) => (
          <ChipButton
            key={n}
            active={gridSize === n}
            onClick={() => onGridSize(n)}
          >
            {n}
          </ChipButton>
        ))}
      </Flex>

      <Flex
        align="center"
        gap={1}
        color={isConnected ? 'green.400' : 'gray.500'}
      >
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
      </Flex>

      <Button
        size="sm"
        variant={showFullNames ? 'solid' : 'outline'}
        onClick={() => onShowFullNames(!showFullNames)}
      >
        <Users size={16} /> {t('fullNames')}
      </Button>

      <Button size="sm" variant="outline" onClick={onShare}>
        <Share2 size={16} /> {t('share')}
      </Button>

      <Button size="sm" variant="outline" onClick={onToggleFullscreen}>
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        {isFullscreen ? t('exitFullscreen') : t('fullscreen')}
      </Button>
    </Flex>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Box
      as="span"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      px={3}
      py={1}
      borderRadius="full"
      fontSize="sm"
      cursor="pointer"
      userSelect="none"
      bg={active ? 'blue.500' : 'gray.800'}
      color={active ? 'white' : 'gray.300'}
      borderWidth="1px"
      borderColor={active ? 'blue.400' : 'gray.700'}
      _hover={{ borderColor: 'blue.400' }}
    >
      {children}
    </Box>
  );
}
