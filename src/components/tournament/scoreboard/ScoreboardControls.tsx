'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { Maximize, Minimize, Share2, Users, Wifi, WifiOff } from 'lucide-react';
import { TournamentCourt } from '@/lib/api/types';
import { formatCourtLabel } from '@/components/tournament/manage/panels/ResultsPanel';

interface Props {
  courts: TournamentCourt[];
  selectedCourtIds: string[];
  gridSize: 1 | 2 | 4 | 6;
  showFullNames: boolean;
  showFinished: boolean;
  isFullscreen: boolean;
  isConnected: boolean;
  onToggleCourt: (id: string) => void;
  onClearCourts: () => void;
  onGridSize: (n: 1 | 2 | 4 | 6) => void;
  onShowFullNames: (show: boolean) => void;
  onShowFinished: (show: boolean) => void;
  onToggleFullscreen: () => void;
  onShare: () => void;
}

const GRID_OPTIONS: Array<1 | 2 | 4 | 6> = [1, 2, 4, 6];

export default function ScoreboardControls({
  courts,
  selectedCourtIds,
  gridSize,
  showFullNames,
  showFinished,
  isFullscreen,
  isConnected,
  onToggleCourt,
  onClearCourts,
  onGridSize,
  onShowFullNames,
  onShowFinished,
  onToggleFullscreen,
  onShare,
}: Props) {
  const t = useTranslations('pages.tournaments.scoreboard');
  const allSelected = selectedCourtIds.length === 0;

  return (
    <Flex
      direction="column"
      gap={3}
      px={4}
      py={3}
      bg="gray.900"
      borderBottomWidth="1px"
      borderColor="gray.800"
    >
      {/* Court filter */}
      <Flex align="center" gap={2} w="full" minW={0}>
        <Text fontSize="sm" color="gray.400" flexShrink={0}>
          {t('selectCourts')}:
        </Text>
        <Flex
          gap={2}
          minW={0}
          overflowX="auto"
          pb={0.5}
          css={{
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          <ChipButton active={allSelected} onClick={onClearCourts}>
            {t('allCourts')}
          </ChipButton>
          {courts.map((court) => (
            <ChipButton
              key={court.id}
              active={selectedCourtIds.includes(court.id)}
              onClick={() => onToggleCourt(court.id)}
            >
              {formatCourtLabel(court, t('court'))}
            </ChipButton>
          ))}
        </Flex>
      </Flex>

      <Flex align="center" justify="space-between" gap={2} w="full" wrap="wrap">
        {/* Grid size */}
        <Flex align="center" gap={2} flexShrink={0}>
          <Text fontSize="sm" color="gray.400">
            {t('gridSize')}:
          </Text>
          <Flex gap={2}>
            {GRID_OPTIONS.map((n) => (
              <ChipButton
                key={n}
                active={gridSize === n}
                onClick={() => onGridSize(n)}
                compact
              >
                {n}
              </ChipButton>
            ))}
          </Flex>
        </Flex>

        <Flex align="center" gap={2} justify="flex-end" flex="1" wrap="wrap">
          <StatusPill isConnected={isConnected} />
          <ControlButton
            active={showFullNames}
            icon={<Users size={16} />}
            label={t('fullNames')}
            onClick={() => onShowFullNames(!showFullNames)}
          />
          <ControlButton
            active={showFinished}
            label={t('showFinished')}
            onClick={() => onShowFinished(!showFinished)}
          />
          <ControlButton
            icon={<Share2 size={16} />}
            label={t('share')}
            onClick={onShare}
          />
          <ControlButton
            icon={
              isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />
            }
            label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            onClick={onToggleFullscreen}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}

function StatusPill({ isConnected }: { isConnected: boolean }) {
  return (
    <Flex
      align="center"
      justify="center"
      h="34px"
      minW="34px"
      px={2}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={isConnected ? 'green.700' : 'gray.700'}
      bg={isConnected ? 'green.950' : 'gray.800'}
      color={isConnected ? 'green.300' : 'gray.500'}
      title={isConnected ? 'Connected' : 'Disconnected'}
      flexShrink={0}
    >
      {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
    </Flex>
  );
}

function ControlButton({
  active = false,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      h="34px"
      px={3}
      borderRadius="lg"
      borderColor={active ? 'green.400' : 'gray.700'}
      bg={active ? 'green.950' : 'gray.800'}
      color={active ? 'green.200' : 'gray.200'}
      fontWeight="semibold"
      _hover={{
        bg: active ? 'green.900' : 'gray.800',
        borderColor: active ? 'green.300' : 'gray.500',
      }}
      flexShrink={0}
    >
      {icon}
      {label}
    </Button>
  );
}

function ChipButton({
  active,
  onClick,
  children,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  compact?: boolean;
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
      px={compact ? 2.5 : 3.5}
      py={1}
      borderRadius="full"
      fontSize="sm"
      lineHeight="1.2"
      cursor="pointer"
      userSelect="none"
      bg={active ? 'blue.500' : 'gray.800'}
      color={active ? 'white' : 'gray.300'}
      borderWidth="1px"
      borderColor={active ? 'blue.400' : 'gray.700'}
      boxShadow={active ? '0 0 0 1px rgba(96, 165, 250, 0.22)' : 'none'}
      whiteSpace="nowrap"
      minW={compact ? '34px' : undefined}
      textAlign="center"
      _hover={{
        bg: active ? 'blue.500' : 'gray.700',
        borderColor: active ? 'blue.300' : 'gray.500',
      }}
    >
      {children}
    </Box>
  );
}
