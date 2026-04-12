import { CourtDirection } from '@/lib/api/types';
import { IconButton } from '@/components/ui/chakra-compat';
import { Badge, Box, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import { Edit, Clock, MapPin, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';

// New implementation: Show all completed matches, not just sessions
export type HistoryMatch = {
  id: string;
  sessionId: string;
  court: string;
  players: string[];
  playerIds?: string[]; // Add playerIds field
  startTime?: string | Date;
  endTime?: string | Date;
  winner?: string;
  scores?: {
    pair1Score: number;
    pair2Score: number;
  };
  winningPair?: 1 | 2;
  isExtra?: boolean;
  notes?: string;
};

// Helper functions
const formatTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
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
}

export const HistoryMatchCard = ({
  match,
  direction = CourtDirection.HORIZONTAL,
  onEdit,
  onDelete,
  onToggleExtra,
}: HistoryMatchCardProps) => {
  const t = useTranslations('SessionDetail.matchs');
  let pair1: string[], pair2: string[];

  if (direction === CourtDirection.HORIZONTAL) {
    pair1 = match.players.slice(0, 2);
    pair2 = match.players.slice(2, 4);
  } else {
    pair1 = [match.players[0], match.players[2]];
    pair2 = [match.players[1], match.players[3]];
  }

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

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      _dark={{ bg: 'gray.800' }}
      p={6}
      transition="transform 0.2s, box-shadow 0.2s"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'md',
      }}
      position="relative"
      data-group
    >
      {(onEdit || onDelete) && (
        <Box position="absolute" top={2} right={2} display="flex" gap={1}>
          {onEdit && (
            <IconButton
              aria-label={t('editMatch')}
              icon={<Edit size={16} />}
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'brand.500', bg: 'brand.50' }}
              onClick={() => onEdit(match)}
            />
          )}
          {onDelete && (
            <IconButton
              aria-label={t('delete')}
              icon={<Trash2 size={16} />}
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'red.500', bg: 'red.50' }}
              onClick={() => onDelete(match)}
            />
          )}
        </Box>
      )}

      <Stack gap={4}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Icon as={MapPin} boxSize={5} color="gray.500" />
            <Text fontWeight="bold">{match.court}</Text>
            {onToggleExtra ? (
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
                _hover={{ opacity: 0.8 }}
                border="none"
                fontWeight="bold"
                display={match.isExtra ? 'block' : 'none'}
                _groupHover={{ display: 'block' }}
              >
                {match.isExtra ? t('extra') : t('main')}
              </Box>
            ) : (
              match.isExtra && (
                <Badge
                  colorPalette="orange"
                  variant="solid"
                  fontSize="xs"
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {t('extra')}
                </Badge>
              )
            )}
          </Flex>
        </Flex>

        <Stack gap={2}>
          <Flex align="center" gap={2}>
            <Icon as={Clock} boxSize={5} color="gray.500" />
            <Box display={'flex'} gap={2}>
              <Text>
                {match.startTime ? `${formatTime(match.startTime)}` : '...'}
                {match.endTime ? ` - ${formatTime(match.endTime)}` : '...'}
              </Text>
              {match.startTime &&
                match.endTime &&
                (() => {
                  const duration = getDurationParts(
                    match.startTime,
                    match.endTime
                  );
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
                  return <Text color="gray.500">({label})</Text>;
                })()}
            </Box>
          </Flex>
        </Stack>

        <Box mt={2}>
          <Flex gap={4}>
            <Box {...pair1WonStyle} flex={1}>
              <Text color="gray.600" fontSize="sm">
                {t('pair1')}
              </Text>
              {pair1.map((p, i) => (
                <Text key={i} fontWeight="semibold">
                  {p}
                </Text>
              ))}
            </Box>
            <Box {...pair2WonStyle} flex={1}>
              <Text color="gray.600" fontSize="sm">
                {t('pair2')}
              </Text>
              {pair2.map((p, i) => (
                <Text key={i} fontWeight="semibold">
                  {p}
                </Text>
              ))}
            </Box>
          </Flex>
        </Box>

        {/* Match score display */}
        {match.scores ? (
          <Box borderTopWidth="1px" pt={4} mt={2}>
            <Text fontWeight="semibold" mb={2}>
              {t('finalScore')}
            </Text>
            <Flex justifyContent="center" alignItems="center" gap={3}>
              <Text fontSize="2xl" fontWeight="bold" {...pair1WonStyle}>
                {match.scores.pair1Score}
              </Text>
              <Text fontSize="lg" color="gray.500">
                -
              </Text>
              <Text fontSize="2xl" fontWeight="bold" {...pair2WonStyle}>
                {match.scores.pair2Score}
              </Text>
            </Flex>
            <Text
              mt={2}
              textAlign="center"
              fontSize="sm"
              fontWeight="bold"
              color={
                match.scores.pair1Score === match.scores.pair2Score
                  ? 'gray.600'
                  : 'green.600'
              }
            >
              {match.scores.pair1Score === match.scores.pair2Score
                ? t('draw')
                : winningPair === 1
                  ? t('pair1Won')
                  : t('pair2Won')}
            </Text>
          </Box>
        ) : (
          <Box borderTopWidth="1px" pt={4} mt={2}>
            <Text fontWeight="semibold" mb={2}>
              {t('finalScore')}
            </Text>
            <Flex justifyContent="center" alignItems="center" gap={3}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.400">
                ...
              </Text>
            </Flex>
          </Box>
        )}

        {match.winner && !match.scores && (
          <Box borderTopWidth="1px" pt={4} mt={2}>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>
              {t('winner', { name: match.winner })}
            </Text>
          </Box>
        )}

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
