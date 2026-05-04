'use client';

import { memo } from 'react';
import { ISession } from '@/lib/api/types';
import type { ViewMode } from '@/hooks/useViewMode';
import { Box, Flex, Badge, Icon } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FindSessionCard from './FindSessionCard';

interface SuggestionSessionCardProps {
  session: ISession & {
    score: number;
    distance: number | null;
    matchReasons: string[];
  };
  variant?: ViewMode;
  onJoin: (session: ISession) => void;
  isJoined?: boolean;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onRegistrationUpdate?: () => void | Promise<void>;
  onHostClick?: (session: ISession) => void;
}

const REASON_CONFIG: Record<
  string,
  { colorPalette: string; translationKey: string }
> = {
  level_match: { colorPalette: 'green', translationKey: 'reasonLevelMatch' },
  nearby: { colorPalette: 'blue', translationKey: 'reasonNearby' },
  familiar_venue: {
    colorPalette: 'purple',
    translationKey: 'reasonFamiliarVenue',
  },
  preferred_time: {
    colorPalette: 'orange',
    translationKey: 'reasonPreferredTime',
  },
  available_slots: {
    colorPalette: 'teal',
    translationKey: 'reasonAvailableSlots',
  },
};

const SuggestionSessionCard = ({
  session,
  variant = 'grid',
  onJoin,
  isJoined,
  userRegistrationStatus,
  onRegistrationUpdate,
  onHostClick,
}: SuggestionSessionCardProps) => {
  const t = useTranslations('suggestions');
  const isCompact = variant === 'list';

  const reasons = session.matchReasons.filter((r) => REASON_CONFIG[r]);

  // Match reason badges - overlay on cover photo in full mode, inline in compact mode
  const matchReasonBadges = !isCompact && reasons.length > 0 && (
    <Box position="absolute" bottom={3} left={3} zIndex={2}>
      <Flex gap={1.5} flexWrap="wrap">
        {reasons.map((reason) => {
          const config = REASON_CONFIG[reason];
          return (
            <Badge
              key={reason}
              colorPalette={config.colorPalette}
              variant="solid"
              size="sm"
              fontSize="xs"
              borderRadius="full"
              px={2}
              py={0.5}
              boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
              backdropFilter="blur(8px)"
              borderWidth="1px"
              borderColor="whiteAlpha.400"
            >
              {t(config.translationKey)}
            </Badge>
          );
        })}
      </Flex>
    </Box>
  );

  // Compact-mode badges rendered inside the card via compactTopContent
  const compactBadges = isCompact && (
    <Flex gap={1} flexWrap="wrap">
      <Badge
        colorPalette="yellow"
        variant="solid"
        fontSize="xs"
        fontWeight="bold"
        px={2}
        py={0.5}
        borderRadius="full"
        display="flex"
        alignItems="center"
        gap={1}
        borderWidth="1px"
        borderColor="yellow.500"
      >
        <Icon as={Sparkles} boxSize={3} />
        Auto
      </Badge>
      {reasons.map((reason) => {
        const config = REASON_CONFIG[reason];
        return (
          <Badge
            key={reason}
            colorPalette={config.colorPalette}
            variant="solid"
            size="sm"
            fontSize="xs"
            borderRadius="full"
            px={2}
            py={0.5}
            borderWidth="1px"
            borderColor={`${config.colorPalette}.400`}
          >
            {t(config.translationKey)}
          </Badge>
        );
      })}
    </Flex>
  );

  return (
    <Box position="relative">
      {/* Auto badge - overlay in full mode only */}
      {!isCompact && (
        <Badge
          position="absolute"
          top={3}
          left={3}
          zIndex={3}
          colorPalette="yellow"
          variant="solid"
          fontSize="xs"
          fontWeight="bold"
          px={2.5}
          py={1}
          borderRadius="full"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
          display="flex"
          alignItems="center"
          gap={1}
          borderWidth="1px"
          borderColor="whiteAlpha.400"
        >
          <Icon as={Sparkles} boxSize={3} />
          Auto
        </Badge>
      )}

      <FindSessionCard
        session={session}
        variant={variant}
        onJoin={onJoin}
        isJoined={isJoined}
        userRegistrationStatus={userRegistrationStatus}
        onRegistrationUpdate={onRegistrationUpdate}
        onHostClick={onHostClick}
        distance={session.distance ?? undefined}
        coverPhotoOverlay={matchReasonBadges}
        compactTopContent={compactBadges}
        showSlotBadge={false}
      />
    </Box>
  );
};

export default memo(SuggestionSessionCard);
