'use client';

import { Player } from '@/types/session';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  Box,
  Grid,
  GridItem,
  HStack,
  Portal,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';
import { Locale } from '@/i18n/locales';

interface BadmintonCourtPlayer extends Player {
  pairNumber?: number;
  isCurrentPlayer?: boolean;
  desire?: string;
  levelDescription?: string;
}

type TooltipPlacement = 'top' | 'bottom';

function getPairColor(player?: BadmintonCourtPlayer, playerIndex?: number) {
  let pairNumber = player?.pairNumber;
  if (!pairNumber && playerIndex !== undefined) {
    pairNumber = playerIndex % 2 === 0 ? 1 : 2;
  } else if (!pairNumber) {
    pairNumber = 1;
  }
  const pairIndex = pairNumber - 1;
  const pairColors = [
    { bg: 'blue.50', border: 'blue.500', text: 'blue.700' },
    { bg: 'orange.50', border: 'orange.500', text: 'orange.700' },
  ];
  return pairColors[pairIndex] || pairColors[0];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface PlayerTooltipProps {
  player: BadmintonCourtPlayer;
  index: number;
  isVisible: boolean;
  mode?: 'manage' | 'view' | 'selection';
  playerRef?: React.RefObject<HTMLDivElement>;
}

function TooltipInfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <GridItem>
      <VStack align="stretch" gap={0.5} minW={0}>
        <Text
          fontSize="11px"
          fontWeight="semibold"
          color="gray.500"
          textTransform="uppercase"
          letterSpacing="0.04em"
        >
          {label}
        </Text>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color={valueColor || 'gray.900'}
          minW={0}
          wordBreak="break-word"
        >
          {value}
        </Text>
      </VStack>
    </GridItem>
  );
}

export default function PlayerTooltip({
  player,
  index,
  isVisible,
  mode = 'manage',
  playerRef,
}: PlayerTooltipProps) {
  const { getLevelShortLabel } = useLevelLabel();
  const t = useTranslations('common');
  const tSession = useTranslations('SessionDetail');
  const locale = useLocale();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({
    left: '0px',
    top: '0px',
  });
  const [placement, setPlacement] = useState<TooltipPlacement>('top');

  const formatWaitTime = (waitTimeInMinutes?: number): string => {
    if (
      waitTimeInMinutes === undefined ||
      waitTimeInMinutes === null ||
      waitTimeInMinutes === 0
    ) {
      return tSession('waitTimeBadgeMinutes', { minutes: 0 });
    }

    const hours = Math.floor(waitTimeInMinutes / 60);
    const minutes = waitTimeInMinutes % 60;

    if (hours > 0) {
      return tSession('waitTimeBadgeHoursMinutes', { hours, minutes });
    }

    return tSession('waitTimeBadgeMinutes', { minutes });
  };

  useEffect(() => {
    if (!isVisible || !playerRef?.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const playerRect = playerRef.current?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      if (!playerRect || !tooltipRect) return;

      const viewportPadding = 12;
      const gap = 10;

      const nextLeft = clamp(
        playerRect.left + playerRect.width / 2 - tooltipRect.width / 2,
        viewportPadding,
        window.innerWidth - tooltipRect.width - viewportPadding
      );

      const fitsAbove =
        playerRect.top >= tooltipRect.height + gap + viewportPadding;
      const nextPlacement: TooltipPlacement = fitsAbove ? 'top' : 'bottom';

      let nextTop = fitsAbove
        ? playerRect.top - tooltipRect.height - gap
        : playerRect.bottom + gap;

      nextTop = clamp(
        nextTop,
        viewportPadding,
        window.innerHeight - tooltipRect.height - viewportPadding
      );

      setPlacement(nextPlacement);
      setTooltipPosition({
        left: `${nextLeft}px`,
        top: `${nextTop}px`,
      });
    };

    const rafId = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [
    isVisible,
    playerRef,
    player.name,
    player.status,
    player.currentWaitTime,
  ]);

  if (!isVisible) return null;

  let pairNumber = player.pairNumber;
  if (!pairNumber) {
    pairNumber = index % 2 === 0 ? 1 : 2;
  }

  const pairColors = getPairColor(player, index);
  const playerName =
    player.name?.trim() || `${t('unknown')} #${player.playerNumber}`;
  const levelLabel = getLevelShortLabel(player.level) || t('notAvailable');
  const matchesPlayed = player.matchesPlayed ?? 0;
  const showWaitTime =
    mode === 'manage' && ['WAITING', 'READY'].includes(player.status);
  const pairLabel =
    locale === Locale.EN
      ? `${t('pair')} ${pairNumber}`
      : `${t('pair')} ${pairNumber}`;

  return (
    <Portal>
      <Box
        ref={tooltipRef}
        role="dialog"
        aria-label={`${playerName}`}
        position="fixed"
        left={tooltipPosition.left}
        top={tooltipPosition.top}
        zIndex={9999}
        maxW="296px"
        minW="248px"
        px={4}
        py={3.5}
        bg="white"
        color="gray.900"
        borderRadius="2xl"
        border="1px solid"
        borderColor="gray.200"
        boxShadow="0 18px 40px rgba(15, 23, 42, 0.16), 0 6px 16px rgba(15, 23, 42, 0.08)"
        animation="tooltipFadeIn 0.18s ease-out"
      >
        <Box
          position="absolute"
          left="50%"
          w="14px"
          h="14px"
          bg="white"
          borderLeft="1px solid"
          borderTop="1px solid"
          borderColor="gray.200"
          transform="translateX(-50%) rotate(45deg)"
          top={placement === 'top' ? 'calc(100% - 7px)' : '-7px'}
        />

        <VStack align="stretch" gap={3} position="relative">
          <HStack justify="space-between" align="start" gap={3}>
            <VStack align="stretch" gap={0.5} minW={0} flex={1}>
              <Text
                fontSize="11px"
                fontWeight="bold"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                #{player.playerNumber}
              </Text>
              <Text
                fontSize="md"
                fontWeight="bold"
                color="gray.900"
                lineHeight="1.3"
                minW={0}
                wordBreak="break-word"
              >
                {playerName}
              </Text>
            </VStack>

            <Box
              px={2.5}
              py={1}
              borderRadius="full"
              bg={pairColors.bg}
              border="1px solid"
              borderColor={pairColors.border}
              flexShrink={0}
            >
              <Text
                fontSize="xs"
                fontWeight="bold"
                color={pairColors.text}
                whiteSpace="nowrap"
              >
                {pairLabel}
              </Text>
            </Box>
          </HStack>

          <Box h="1px" bg="gray.100" />

          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={3}>
            <TooltipInfoRow
              label={t('gender')}
              value={
                player.gender === 'MALE'
                  ? t('male')
                  : player.gender === 'FEMALE'
                    ? t('female')
                    : player.gender === 'OTHER'
                      ? t('other')
                      : t('preferNotToSay')
              }
            />

            {mode === 'manage' && (
              <TooltipInfoRow label={t('level')} value={levelLabel} />
            )}

            <TooltipInfoRow label={t('matchesPlayed')} value={matchesPlayed} />

            {showWaitTime && (
              <TooltipInfoRow
                label={t('waitTime')}
                value={formatWaitTime(player.currentWaitTime)}
              />
            )}
          </Grid>
        </VStack>

        <style jsx>{`
          @keyframes tooltipFadeIn {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </Box>
    </Portal>
  );
}

export type { BadmintonCourtPlayer };
