import { CourtDirection } from '@/lib/api/types';
import { IconButton } from '@/components/ui/chakra-compat';
import {
  Badge,
  Box,
  Flex,
  Grid,
  HStack,
  Icon,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Edit, Clock, MapPin, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';

// New implementation: Show all completed matches, not just sessions
export type HistoryMatch = {
  id: string;
  sessionId: string;
  court: string;
  players: string[];
  playerIds?: string[];
  startTime?: string | Date;
  endTime?: string | Date;
  winner?: string;
  scores?: {
    pair1Score: number;
    pair2Score: number;
  };
  winningPair?: 1 | 2;
  isDraw?: boolean;
  direction?: CourtDirection;
  isExtra?: boolean;
  notes?: string;
};

// Helper functions
const formatTime = (dateString: string | Date): string => {
  return formatTimeByDevicePreference(dateString);
};

const getDurationParts = (
  startTime?: string | Date,
  endTime?: string | Date
): {
  type: 'none' | 'lessThan1Min' | 'hoursMinutes' | 'minutes';
  hours?: number;
  minutes?: number;
} => {
  if (!startTime || !endTime) return { type: 'none' };

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  if (durationMinutes < 1) return { type: 'lessThan1Min' };

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0) {
    return { type: 'hoursMinutes', hours, minutes };
  }
  return { type: 'minutes', minutes };
};

interface HistoryMatchCardProps {
  match: HistoryMatch;
  direction?: CourtDirection;
  onEdit?: (match: HistoryMatch) => void;
  onDelete?: (match: HistoryMatch) => void;
  onToggleExtra?: (match: HistoryMatch) => void;
  variant?: 'grid' | 'list';
}

type TeamStyle = {
  fontWeight?: string;
  color?: string;
};

const parsePlayerLabel = (player: string) => {
  const match = player.match(/^\((#\d+)\)\s+(.*)$/);
  return {
    number: match ? match[1] : null,
    name: match ? match[2] : player,
  };
};

export const HistoryMatchCard = ({
  match,
  direction = CourtDirection.HORIZONTAL,
  onEdit,
  onDelete,
  onToggleExtra,
  variant = 'grid',
}: HistoryMatchCardProps) => {
  const t = useTranslations('SessionDetail.matchs');
  const isSingles = match.players.length <= 2;
  let pair1: string[], pair2: string[];

  if (isSingles) {
    pair1 = [match.players[0]].filter(Boolean);
    pair2 = [match.players[1]].filter(Boolean);
  } else if (direction === CourtDirection.HORIZONTAL) {
    pair1 = match.players.slice(0, 2);
    pair2 = match.players.slice(2, 4);
  } else {
    pair1 = [match.players[0], match.players[2]];
    pair2 = [match.players[1], match.players[3]];
  }

  const side1Label = isSingles ? t('player1') : t('pair1');
  const side2Label = isSingles ? t('player2') : t('pair2');

  const winningPair = match.winningPair;
  // Winning pair: blue, losing pair: red
  const pair1WonStyle =
    winningPair === 1
      ? { fontWeight: 'bold', color: 'brand.600' }
      : winningPair === 2
        ? { fontWeight: 'bold', color: 'red.600' }
        : {};
  const pair2WonStyle =
    winningPair === 2
      ? { fontWeight: 'bold', color: 'brand.600' }
      : winningPair === 1
        ? { fontWeight: 'bold', color: 'red.600' }
        : {};
  const isDraw =
    match.isDraw ?? match.scores?.pair1Score === match.scores?.pair2Score;
  const winnerLabel = match.scores
    ? isDraw
      ? t('draw')
      : winningPair === 1
        ? isSingles
          ? t('player1Won')
          : t('pair1Won')
        : isSingles
          ? t('player2Won')
          : t('pair2Won')
    : match.winner
      ? t('winner', { name: match.winner })
      : null;

  const actionButtons = (size: 'xs' | 'sm' = 'sm') =>
    (onEdit || onDelete) && (
      <HStack gap={1} flexShrink={0}>
        {onEdit && (
          <IconButton
            aria-label={t('editMatch')}
            icon={<Edit size={size === 'xs' ? 14 : 16} />}
            size={size}
            variant="ghost"
            color="gray.500"
            _hover={{ color: 'brand.500', bg: 'brand.50' }}
            onClick={() => onEdit(match)}
          />
        )}
        {onDelete && (
          <IconButton
            aria-label={t('delete')}
            icon={<Trash2 size={size === 'xs' ? 14 : 16} />}
            size={size}
            variant="ghost"
            color="gray.500"
            _hover={{ color: 'red.500', bg: 'red.50' }}
            onClick={() => onDelete(match)}
          />
        )}
      </HStack>
    );

  const matchTypeBadge =
    onToggleExtra || match.isExtra ? (
      onToggleExtra ? (
        <Box
          as="button"
          onClick={() => onToggleExtra(match)}
          bg={match.isExtra ? 'orange.500' : 'brand.600'}
          color="white"
          fontSize="xs"
          px={2}
          py={1}
          borderRadius="md"
          cursor="pointer"
          _hover={{ opacity: 0.88 }}
          border="none"
          fontWeight="bold"
          lineHeight="1"
          flexShrink={0}
        >
          {match.isExtra ? t('extra') : t('main')}
        </Box>
      ) : (
        <Badge
          colorPalette="orange"
          variant="solid"
          fontSize="xs"
          px={2}
          py={1}
          borderRadius="md"
          lineHeight="1"
          flexShrink={0}
        >
          {t('extra')}
        </Badge>
      )
    ) : null;

  const timeBlock = (showDuration: boolean) => (
    <HStack gap={2} color="gray.600" _dark={{ color: 'gray.300' }} minW={0}>
      <Icon as={Clock} boxSize={4} color="gray.500" flexShrink={0} />
      <Text fontSize="sm" truncate>
        {match.startTime ? `${formatTime(match.startTime)}` : '...'}
        {match.endTime ? ` - ${formatTime(match.endTime)}` : '...'}
      </Text>
      {showDuration &&
        match.startTime &&
        match.endTime &&
        (() => {
          const duration = getDurationParts(match.startTime, match.endTime);
          if (duration.type === 'none') return null;
          const label =
            duration.type === 'lessThan1Min'
              ? t('lessThan1Min')
              : duration.type === 'hoursMinutes'
                ? t('durationHoursMinutes', {
                    hours: duration.hours!,
                    minutes: duration.minutes!,
                  })
                : t('durationMinutes', { minutes: duration.minutes! });
          return (
            <Text color="gray.500" fontSize="sm" whiteSpace="nowrap">
              ({label})
            </Text>
          );
        })()}
    </HStack>
  );

  const teamBlock = (
    label: string,
    players: string[],
    style: TeamStyle,
    compact = false
  ) => (
    <Box
      {...style}
      flex={1}
      minW={0}
      bg={compact ? undefined : 'gray.50'}
      _dark={compact ? undefined : { bg: 'gray.900/40' }}
      borderRadius="md"
      px={compact ? 0 : 3}
      py={compact ? 0 : 2.5}
    >
      {!compact && (
        <Text color="gray.600" fontSize="xs" fontWeight="semibold" mb={1}>
          {label}
        </Text>
      )}
      <Stack gap={compact ? 0.5 : 1}>
        {players.map((player, index) => {
          const { number, name } = parsePlayerLabel(player);

          return (
            <HStack key={index} gap={1} align="baseline" minW={0}>
              {number && (
                <Text color="gray.500" fontSize="xs" fontWeight="medium">
                  {number}
                </Text>
              )}
              <Text
                fontSize={compact ? 'sm' : 'md'}
                fontWeight="semibold"
                truncate
              >
                {name}
              </Text>
            </HStack>
          );
        })}
      </Stack>
    </Box>
  );

  const scoreBlock = (compact = false) =>
    match.scores ? (
      <Box
        borderTopWidth={compact ? 0 : '1px'}
        pt={compact ? 0 : 3}
        minW={compact ? '76px' : undefined}
      >
        {!compact && (
          <Text fontWeight="semibold" mb={1.5}>
            {t('finalScore')}
          </Text>
        )}
        <Flex justifyContent="center" alignItems="center" gap={2}>
          <Text
            fontSize={compact ? 'xl' : '2xl'}
            fontWeight="bold"
            lineHeight="1"
            {...pair1WonStyle}
          >
            {match.scores.pair1Score}
          </Text>
          <Text fontSize="sm" color="gray.500">
            -
          </Text>
          <Text
            fontSize={compact ? 'xl' : '2xl'}
            fontWeight="bold"
            lineHeight="1"
            {...pair2WonStyle}
          >
            {match.scores.pair2Score}
          </Text>
        </Flex>
        {winnerLabel && !compact && (
          <Text
            mt={1.5}
            textAlign="center"
            fontSize="sm"
            fontWeight="bold"
            color={isDraw ? 'gray.600' : 'green.600'}
          >
            {winnerLabel}
          </Text>
        )}
      </Box>
    ) : (
      <Box
        borderTopWidth={compact ? 0 : '1px'}
        pt={compact ? 0 : 3}
        minW={compact ? '76px' : undefined}
      >
        {!compact && (
          <Text fontWeight="semibold" mb={1.5}>
            {t('finalScore')}
          </Text>
        )}
        <Flex justifyContent="center" alignItems="center" gap={2}>
          <Text
            fontSize={compact ? 'xl' : '2xl'}
            fontWeight="bold"
            color="gray.400"
            lineHeight="1"
          >
            ...
          </Text>
        </Flex>
      </Box>
    );

  if (variant === 'list') {
    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        p={3}
        transition="box-shadow 0.2s, border-color 0.2s"
        _hover={{ boxShadow: 'sm', borderColor: 'green.200' }}
      >
        <Stack gap={2.5}>
          <Flex align="flex-start" justify="space-between" gap={2}>
            <Stack gap={1} minW={0} flex={1}>
              <HStack gap={1.5} minW={0}>
                <Icon as={MapPin} boxSize={4} color="gray.500" />
                <Text fontWeight="bold" fontSize="sm" truncate>
                  {match.court}
                </Text>
                {matchTypeBadge}
              </HStack>
              {timeBlock(false)}
            </Stack>
            {actionButtons('xs')}
          </Flex>

          <Flex align="center" gap={3}>
            <Grid
              templateColumns="minmax(0, 1fr) minmax(0, 1fr)"
              gap={3}
              flex={1}
            >
              {teamBlock(side1Label, pair1, pair1WonStyle, true)}
              {teamBlock(side2Label, pair2, pair2WonStyle, true)}
            </Grid>
            {scoreBlock(true)}
          </Flex>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      p={4}
      transition="box-shadow 0.2s, border-color 0.2s"
      _hover={{ boxShadow: 'md', borderColor: 'green.200' }}
    >
      <Stack gap={3}>
        <Flex align="flex-start" justify="space-between" gap={3}>
          <Stack gap={1.5} minW={0}>
            <HStack gap={2} minW={0}>
              <Icon as={MapPin} boxSize={4.5} color="gray.500" />
              <Text fontWeight="bold" truncate>
                {match.court}
              </Text>
              {matchTypeBadge}
            </HStack>
            {timeBlock(true)}
          </Stack>
          {actionButtons('sm')}
        </Flex>

        <Flex gap={3}>
          {teamBlock(side1Label, pair1, pair1WonStyle)}
          {teamBlock(side2Label, pair2, pair2WonStyle)}
        </Flex>

        {scoreBlock(false)}

        {match.notes && (
          <Box
            p={2}
            bg="orange.50"
            _dark={{ bg: 'orange.900/30' }}
            borderRadius="md"
            borderLeftWidth="4px"
            borderLeftColor="orange.400"
          >
            <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.200' }}>
              {match.notes}
            </Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
};
