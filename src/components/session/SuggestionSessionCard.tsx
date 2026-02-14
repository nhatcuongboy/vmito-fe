'use client';

import { ISession } from '@/lib/api/types';
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
  onJoin: () => void;
  isJoined?: boolean;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onRegistrationUpdate?: () => void | Promise<void>;
  onHostClick?: () => void;
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
    colorPalette: 'gray',
    translationKey: 'reasonAvailableSlots',
  },
};

const SuggestionSessionCard = ({
  session,
  onJoin,
  isJoined,
  userRegistrationStatus,
  onRegistrationUpdate,
  onHostClick,
}: SuggestionSessionCardProps) => {
  const t = useTranslations('suggestions');

  const reasons = session.matchReasons.filter((r) => REASON_CONFIG[r]);

  return (
    <Box position="relative">
      {/* Auto badge overlay */}
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
      >
        <Icon as={Sparkles} boxSize={3} />
        Auto
      </Badge>

      <FindSessionCard
        session={session}
        onJoin={onJoin}
        isJoined={isJoined}
        userRegistrationStatus={userRegistrationStatus}
        onRegistrationUpdate={onRegistrationUpdate}
        onHostClick={onHostClick}
        distance={session.distance ?? undefined}
      />

      {/* Match reason badges */}
      {reasons.length > 0 && (
        <Flex gap={1.5} mt={2} flexWrap="wrap" px={1}>
          {reasons.map((reason) => {
            const config = REASON_CONFIG[reason];
            return (
              <Badge
                key={reason}
                colorPalette={config.colorPalette}
                variant="subtle"
                size="sm"
                fontSize="xs"
                borderRadius="full"
                px={2}
                py={0.5}
              >
                {t(config.translationKey)}
              </Badge>
            );
          })}
        </Flex>
      )}
    </Box>
  );
};

export default SuggestionSessionCard;
