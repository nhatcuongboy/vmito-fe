'use client';

import { memo } from 'react';
import { ISession } from '@/lib/api/types';
import type { ViewMode } from '@/hooks/useViewMode';
import { Box, Flex, Badge, Icon } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import FindSessionCard from './FindSessionCard';

const MAX_VISIBLE_REASONS = 3;
const REASON_PRIORITY = [
  'level_match',
  'nearby',
  'favorite_host',
  'familiar_venue',
  'preferred_time',
];

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

const REASON_CONFIG: Record<string, { translationKey: string }> = {
  level_match: { translationKey: 'reasonLevelMatch' },
  nearby: { translationKey: 'reasonNearby' },
  familiar_venue: {
    translationKey: 'reasonFamiliarVenue',
  },
  favorite_host: {
    translationKey: 'reasonFavoriteHost',
  },
  preferred_time: {
    translationKey: 'reasonPreferredTime',
  },
  available_slots: {
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

  const reasons = REASON_PRIORITY.filter((reason) =>
    session.matchReasons.includes(reason)
  ).slice(0, MAX_VISIBLE_REASONS);

  // Full mode overlays: AI badge + match reason badges
  const fullModeOverlay = !isCompact && (
    <>
      {/* AI Suggestion Badge */}
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
        {t('suggestionBadge')}
      </Badge>

      {/* Match Reason Badges */}
      {reasons.length > 0 && (
        <Box position="absolute" bottom={3} left={3} right={3} zIndex={2}>
          <Flex gap={1.5} flexWrap="wrap">
            {reasons.map((reason) => {
              const config = REASON_CONFIG[reason];
              return (
                <Badge
                  key={reason}
                  bg="blackAlpha.700"
                  color="white"
                  size="sm"
                  fontSize="xs"
                  fontWeight="semibold"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
                  backdropFilter="blur(8px)"
                  borderWidth="1px"
                  borderColor="whiteAlpha.500"
                >
                  {t(config.translationKey)}
                </Badge>
              );
            })}
          </Flex>
        </Box>
      )}
    </>
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
        {t('suggestionBadge')}
      </Badge>
      {reasons.map((reason) => {
        const config = REASON_CONFIG[reason];
        return (
          <Badge
            key={reason}
            bg="blackAlpha.700"
            color="white"
            size="sm"
            fontSize="xs"
            fontWeight="semibold"
            borderRadius="full"
            px={2}
            py={0.5}
            borderWidth="1px"
            borderColor="whiteAlpha.500"
          >
            {t(config.translationKey)}
          </Badge>
        );
      })}
    </Flex>
  );

  return (
    <FindSessionCard
      session={session}
      variant={variant}
      onJoin={onJoin}
      isJoined={isJoined}
      userRegistrationStatus={userRegistrationStatus}
      onRegistrationUpdate={onRegistrationUpdate}
      onHostClick={onHostClick}
      distance={session.distance ?? undefined}
      coverPhotoOverlay={fullModeOverlay}
      compactTopContent={compactBadges}
      showSlotBadge={false}
    />
  );
};

export default memo(SuggestionSessionCard);
