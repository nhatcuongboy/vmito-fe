'use client';

import React from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  MenuRoot,
  MenuTrigger,
  MenuPositioner,
  MenuContent,
  MenuItem,
  MenuSeparator,
} from '@chakra-ui/react';
import { VTooltip } from '@/components/ui/VTooltip';
import { useTranslations } from 'next-intl';
import {
  Check,
  ChevronDown,
  CircleCheck,
  Maximize,
  Minimize,
  Share2,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { TournamentCourt } from '@/lib/api/types';
import { formatCourtLabel } from '@/lib/tournament/court';

interface Props {
  courts: TournamentCourt[];
  selectedCourtIds: string[];
  gridSize: 1 | 2 | 4 | 6;
  showFullNames: boolean;
  showFinished: boolean;
  isFullscreen: boolean;
  isConnected: boolean;
  tournamentName?: string | null;
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
  tournamentName,
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
    <Box
      px={4}
      py={3}
      bg="gray.900"
      borderBottomWidth="1px"
      borderColor="gray.800"
    >
      {/* Mobile: tournament name pinned to the top */}
      {tournamentName && (
        <Text
          display={{ base: 'block', md: 'none' }}
          textAlign="center"
          fontWeight="bold"
          fontSize="sm"
          color="gray.100"
          mb={2.5}
          truncate
        >
          {tournamentName}
        </Text>
      )}

      <Flex align="center" gap={2} wrap="wrap" position="relative">
        {/* Left controls */}
        <Flex align="center" gap={2} wrap="wrap" flexShrink={0}>
          {/* Court multi-select */}
          <MenuRoot
            closeOnSelect={false}
            positioning={{ placement: 'bottom-start' }}
          >
            <MenuTrigger asChild>
              <TriggerButton>
                <Text as="span">{t('selectCourts')}</Text>
                {!allSelected && (
                  <CountBadge>{selectedCourtIds.length}</CountBadge>
                )}
                <ChevronDown size={14} />
              </TriggerButton>
            </MenuTrigger>
            <MenuPositioner>
              <MenuContent
                bg="gray.900"
                borderColor="gray.700"
                color="gray.100"
                minW="200px"
                maxH="320px"
                overflowY="auto"
                boxShadow="0 12px 32px rgba(0, 0, 0, 0.5)"
                zIndex={2000}
              >
                <DropdownItem
                  value="all"
                  active={allSelected}
                  onClick={onClearCourts}
                >
                  {t('allCourts')}
                </DropdownItem>
                <MenuSeparator borderColor="gray.700" />
                {courts.map((court) => (
                  <DropdownItem
                    key={court.id}
                    value={court.id}
                    active={selectedCourtIds.includes(court.id)}
                    onClick={() => onToggleCourt(court.id)}
                  >
                    {formatCourtLabel(court, t('court'))}
                  </DropdownItem>
                ))}
              </MenuContent>
            </MenuPositioner>
          </MenuRoot>

          {/* Grid size select */}
          <MenuRoot positioning={{ placement: 'bottom-start' }}>
            <MenuTrigger asChild>
              <TriggerButton>
                <Text as="span">{t('gridSize')}</Text>
                <CountBadge>{gridSize}</CountBadge>
                <ChevronDown size={14} />
              </TriggerButton>
            </MenuTrigger>
            <MenuPositioner>
              <MenuContent
                bg="gray.900"
                borderColor="gray.700"
                color="gray.100"
                minW="140px"
                boxShadow="0 12px 32px rgba(0, 0, 0, 0.5)"
                zIndex={2000}
              >
                {GRID_OPTIONS.map((n) => (
                  <DropdownItem
                    key={n}
                    value={String(n)}
                    active={gridSize === n}
                    closeOnSelect
                    onClick={() => onGridSize(n)}
                  >
                    {n}
                  </DropdownItem>
                ))}
              </MenuContent>
            </MenuPositioner>
          </MenuRoot>
        </Flex>

        {/* Desktop: tournament name centered in the header */}
        {tournamentName && (
          <Flex
            display={{ base: 'none', md: 'flex' }}
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
            maxW="42%"
            justify="center"
            pointerEvents="none"
          >
            <Text fontWeight="bold" fontSize="md" color="gray.100" truncate>
              {tournamentName}
            </Text>
          </Flex>
        )}

        {/* Right-side actions */}
        <Flex align="center" gap={2} ml="auto" justify="flex-end" wrap="wrap">
          <StatusPill isConnected={isConnected} />
          <IconControlButton
            active={showFullNames}
            icon={<Users size={16} />}
            label={t('fullNames')}
            onClick={() => onShowFullNames(!showFullNames)}
          />
          <IconControlButton
            active={showFinished}
            icon={<CircleCheck size={16} />}
            label={t('showFinished')}
            onClick={() => onShowFinished(!showFinished)}
          />
          <IconControlButton
            icon={<Share2 size={16} />}
            label={t('share')}
            onClick={onShare}
          />
          <IconControlButton
            icon={
              isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />
            }
            label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
            onClick={onToggleFullscreen}
          />
        </Flex>
      </Flex>
    </Box>
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

const TriggerButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(function TriggerButton(props, ref) {
  return (
    <Button
      ref={ref}
      size="sm"
      variant="outline"
      h="34px"
      px={3}
      borderRadius="lg"
      borderColor="gray.700"
      bg="gray.800"
      color="gray.100"
      fontWeight="semibold"
      flexShrink={0}
      _hover={{ bg: 'gray.700', borderColor: 'gray.500' }}
      {...props}
    />
  );
});

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      minW="20px"
      h="20px"
      px={1.5}
      borderRadius="full"
      bg="blue.500"
      color="white"
      fontSize="xs"
      fontWeight="bold"
      lineHeight="1"
    >
      {children}
    </Box>
  );
}

function DropdownItem({
  value,
  active,
  onClick,
  children,
  closeOnSelect = false,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  closeOnSelect?: boolean;
}) {
  return (
    <MenuItem
      value={value}
      closeOnSelect={closeOnSelect}
      onClick={onClick}
      color={active ? 'blue.300' : 'gray.100'}
      fontWeight={active ? 'semibold' : 'normal'}
      _hover={{ bg: 'gray.800' }}
      _highlighted={{ bg: 'gray.800' }}
      justifyContent="space-between"
    >
      <Text as="span">{children}</Text>
      {active && <Check size={15} />}
    </MenuItem>
  );
}

function IconControlButton({
  active = false,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <VTooltip
      content={label}
      portalled={false}
      openDelay={150}
      contentProps={{
        bg: 'gray.800',
        color: 'white',
        borderColor: 'gray.600',
      }}
    >
      <Button
        size="sm"
        variant="outline"
        onClick={onClick}
        aria-label={label}
        h="34px"
        w="34px"
        minW="34px"
        px={0}
        borderRadius="lg"
        borderColor={active ? 'green.400' : 'gray.700'}
        bg={active ? 'green.950' : 'gray.800'}
        color={active ? 'green.200' : 'gray.200'}
        _hover={{
          bg: active ? 'green.900' : 'gray.700',
          borderColor: active ? 'green.300' : 'gray.500',
        }}
        flexShrink={0}
      >
        {icon}
      </Button>
    </VTooltip>
  );
}
