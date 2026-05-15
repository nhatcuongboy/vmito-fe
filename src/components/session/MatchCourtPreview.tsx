'use client';

import BadmintonCourt from '@/components/court/BadmintonCourt';
import { CourtDirection } from '@/lib/api/types';
import { Player } from '@/types/session';
import { Badge, Box, Flex, HStack, Text } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

type MatchCourtPlayer = Player & {
  pairNumber?: number;
  isCurrentPlayer?: boolean;
  courtPosition?: number;
};

interface MatchCourtPreviewProps {
  players: MatchCourtPlayer[];
  pair1Players?: Player[];
  pair2Players?: Player[];
  scoreDifference?: number;
  courtName?: string;
  courtNumber?: number;
  courtColor?: string;
  direction?: CourtDirection;
  isLoading?: boolean;
  showAiLoadingOverlay?: boolean;
  aiLoadingLabel?: string;
  maxW?: { base: string; md: string } | string;
}

export default function MatchCourtPreview({
  players,
  pair1Players,
  pair2Players,
  scoreDifference,
  courtName,
  courtNumber,
  courtColor,
  direction = CourtDirection.HORIZONTAL,
  isLoading = false,
  showAiLoadingOverlay = false,
  aiLoadingLabel,
  maxW = { base: '100%', md: '360px' },
}: MatchCourtPreviewProps) {
  const t = useTranslations('SessionDetail');
  const hasPairStats =
    scoreDifference !== undefined &&
    ((pair1Players?.length ?? 0) > 0 || (pair2Players?.length ?? 0) > 0);

  return (
    <Box
      w="full"
      maxW={maxW}
      mx="auto"
      position="relative"
      _dark={{ filter: 'saturate(0.85) brightness(0.92)' }}
    >
      <BadmintonCourt
        players={players}
        isActive={true}
        courtName={courtName}
        courtNumber={courtNumber}
        width="100%"
        isLoading={isLoading}
        direction={direction}
        courtColor={courtColor}
      />

      {showAiLoadingOverlay && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={hasPairStats ? '58px' : 0}
          align="center"
          justify="center"
          bg="blackAlpha.600"
          zIndex={5}
          borderRadius="md"
          direction="column"
          gap={2}
        >
          <Box
            width="60%"
            height="4px"
            bg="whiteAlpha.300"
            borderRadius="full"
            overflow="hidden"
          >
            <Box
              height="100%"
              width="40%"
              bg="purple.400"
              borderRadius="full"
              animation="aiSlide 1.5s ease-in-out infinite"
              css={{
                '@keyframes aiSlide': {
                  '0%': { transform: 'translateX(-100%)' },
                  '50%': { transform: 'translateX(200%)' },
                  '100%': { transform: 'translateX(-100%)' },
                },
              }}
            />
          </Box>
          <HStack gap={1.5}>
            <Box
              as={Sparkles}
              boxSize={3.5}
              color="purple.300"
              animation="pulse 1.5s ease-in-out infinite"
              css={{
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.6 },
                  '50%': { opacity: 1 },
                },
              }}
            />
            <Text fontSize="xs" color="white" fontWeight="medium">
              {aiLoadingLabel ?? t('courtsTab.loadingSuggestedPlayers')}
            </Text>
          </HStack>
        </Flex>
      )}

      {hasPairStats && (
        <MatchPairStats
          pair1Players={pair1Players}
          pair2Players={pair2Players}
          scoreDifference={scoreDifference}
        />
      )}
    </Box>
  );
}

interface MatchPairStatsProps {
  pair1Players?: Player[];
  pair2Players?: Player[];
  scoreDifference: number;
}

export function MatchPairStats({
  pair1Players,
  pair2Players,
  scoreDifference,
}: MatchPairStatsProps) {
  const t = useTranslations('SessionDetail');

  return (
    <HStack
      justify="space-between"
      align="flex-start"
      mt={2}
      px={2}
      py={1.5}
      bg={{ base: 'gray.50', _dark: 'whiteAlpha.100' }}
      borderRadius="md"
      fontSize="xs"
      borderWidth="1px"
      borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }}
    >
      <PairSummary
        colorPalette="blue"
        label={t('courtsTab.pair1')}
        players={pair1Players}
      />

      <Box textAlign="center" pt={0.5}>
        <Text color="gray.400" fontSize="2xs">
          {t('courtsTab.gapLabel')}
        </Text>
        <Badge colorPalette="yellow" variant="solid" size="sm">
          {scoreDifference}{' '}
          <Text as="span" fontSize="2xs" fontWeight="normal">
            {t('courtsTab.levelUnit')}
          </Text>
        </Badge>
      </Box>

      <PairSummary
        colorPalette="orange"
        label={t('courtsTab.pair2')}
        players={pair2Players}
      />
    </HStack>
  );
}

interface PairSummaryProps {
  colorPalette: 'blue' | 'orange';
  label: string;
  players?: Player[];
}

function PairSummary({ colorPalette, label, players }: PairSummaryProps) {
  return (
    <Box textAlign="center" flex="1" minW={0}>
      <HStack gap={1} justify="center" mb={0.5}>
        <Badge colorPalette={colorPalette} variant="solid" size="sm">
          {label}
        </Badge>
      </HStack>
      {players?.map((player) => (
        <Text
          key={player.id}
          color={{ base: 'gray.600', _dark: 'gray.300' }}
          lineClamp={1}
          fontSize="xs"
        >
          {player.name || `#${player.playerNumber}`}
        </Text>
      ))}
    </Box>
  );
}
