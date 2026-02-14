import { CourtDirection } from '@/lib/api/types';
import { IconButton } from '@/components/ui/chakra-compat';
import { Badge, Box, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import { Edit, Clock, MapPin } from 'lucide-react';
import React from 'react';

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
};

// Helper functions
const formatTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (
  startTime?: string | Date,
  endTime?: string | Date
): string => {
  if (!startTime || !endTime) return '';

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));

  if (durationMinutes < 1) return '< 1 min';

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

interface HistoryMatchCardProps {
  match: HistoryMatch;
  direction?: CourtDirection;
  onEdit?: (match: HistoryMatch) => void;
}

export const HistoryMatchCard = ({
  match,
  direction = CourtDirection.HORIZONTAL,
  onEdit,
}: HistoryMatchCardProps) => {
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
    >
      {onEdit && (
        <Box position="absolute" top={2} right={2}>
          <IconButton
            aria-label="Edit match"
            icon={<Edit size={16} />}
            size="sm"
            variant="ghost"
            color="gray.400"
            _hover={{ color: 'brand.500', bg: 'brand.50' }}
            onClick={() => onEdit(match)}
          />
        </Box>
      )}

      <Stack gap={4}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={2}>
            <Icon as={MapPin} boxSize={5} color="gray.500" />
            <Text fontWeight="bold">{match.court}</Text>
            {match.isExtra && (
              <Badge
                colorPalette="orange"
                variant="solid"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                Extra
              </Badge>
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
              {match.startTime && match.endTime && (
                <Text color="gray.500">{`(${formatDuration(
                  match.startTime,
                  match.endTime
                )})`}</Text>
              )}
            </Box>
          </Flex>
        </Stack>

        <Box mt={2}>
          <Text fontWeight="semibold" mb={1}>
            Players
          </Text>
          <Flex gap={4}>
            <Box {...pair1WonStyle}>
              <Text color="gray.600" fontSize="sm">
                Pair 1
              </Text>
              <Text fontWeight="semibold">{pair1.join(' & ')}</Text>
            </Box>
            <Box {...pair2WonStyle}>
              <Text color="gray.600" fontSize="sm">
                Pair 2
              </Text>
              <Text fontWeight="semibold">{pair2.join(' & ')}</Text>
            </Box>
          </Flex>
        </Box>

        {/* Match score display */}
        {match.scores ? (
          <Box borderTopWidth="1px" pt={4} mt={2}>
            <Text fontWeight="semibold" mb={2}>
              Final Score
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
                ? '(Draw)'
                : winningPair === 1
                  ? '(Pair 1 Won)'
                  : '(Pair 2 Won)'}
            </Text>
          </Box>
        ) : (
          <Box borderTopWidth="1px" pt={4} mt={2}>
            <Text fontWeight="semibold" mb={2}>
              Final Score
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
              Winner: {match.winner}
            </Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
};
