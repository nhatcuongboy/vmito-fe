'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  SimpleGrid,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { Star, CheckCircle, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RatingService } from '@/lib/api/rating.service';
import { SubmitRatingModal } from './SubmitRatingModal';
import { StarRatingDisplay } from './StarRatingDisplay';
import {
  Player,
  SessionRatingEligibility,
  RatingType,
  Rating,
} from '@/lib/api/types';

interface RatePlayersSectionProps {
  sessionId: string;
  players: Player[];
}

export const RatePlayersSection = ({
  sessionId,
  players,
}: RatePlayersSectionProps) => {
  const t = useTranslations('rating');
  const [eligibility, setEligibility] = useState<SessionRatingEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const fetchEligibility = async () => {
    setIsLoading(true);
    try {
      const data = await RatingService.getSessionRatingEligibility(sessionId);
      setEligibility(data);
    } catch (error) {
      console.error('Failed to fetch rating eligibility:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibility();
  }, [sessionId]);

  const handleRatePlayer = (player: Player) => {
    setSelectedPlayer(player);
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => {
    fetchEligibility();
    setShowRatingModal(false);
    setSelectedPlayer(null);
  };

  const getPlayerRating = (playerId: string): Rating | undefined => {
    return eligibility?.playerRatings?.find(
      (r) => r.ratedUserId === players.find((p) => p.id === playerId)?.userId
    );
  };

  const canRatePlayer = (player: Player): boolean => {
    if (!player.userId) return false;
    return eligibility?.canRatePlayers?.includes(player.userId) || false;
  };

  const hasRatedPlayer = (player: Player): boolean => {
    if (!player.userId) return false;
    return eligibility?.ratedPlayerIds?.includes(player.userId) || false;
  };

  // Only show players with userId (registered users)
  const rateablePlayers = players.filter((p) => p.userId);

  if (isLoading) {
    return (
      <Box
        p={6}
        bg="white"
        borderRadius="xl"
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <HStack justify="center" py={4}>
          <Spinner size="sm" />
          <Text color="gray.500">{t('loading') || 'Loading...'}</Text>
        </HStack>
      </Box>
    );
  }

  if (rateablePlayers.length === 0) {
    return null;
  }

  return (
    <>
      <Box
        p={6}
        bg="white"
        borderRadius="xl"
        shadow="sm"
        border="1px solid"
        borderColor="gray.100"
      >
        <HStack gap={2} mb={4}>
          <Star size={20} color="#F6AD55" />
          <Text fontWeight="semibold" color="gray.700">
            {t('ratePlayer')}
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {rateablePlayers.map((player) => {
            const rated = hasRatedPlayer(player);
            const canRate = canRatePlayer(player);
            const playerRating = rated
              ? eligibility?.playerRatings?.find(
                  (r) => r.ratedUserId === player.userId
                )
              : null;

            return (
              <HStack
                key={player.id}
                p={3}
                bg={rated ? 'green.50' : 'gray.50'}
                borderRadius="lg"
                justify="space-between"
              >
                <HStack gap={3}>
                  <Avatar.Root size="sm" borderRadius="full">
                    <Avatar.Fallback
                      name={player.name || `Player ${player.playerNumber}`}
                    >
                      <User size={14} />
                    </Avatar.Fallback>
                    {player.user?.image && (
                      <Avatar.Image src={player.user.image} />
                    )}
                  </Avatar.Root>
                  <VStack align="start" gap={0}>
                    <Text fontSize="sm" fontWeight="medium">
                      {player.name || `Player ${player.playerNumber}`}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      #{player.playerNumber}
                    </Text>
                  </VStack>
                </HStack>

                {rated && playerRating ? (
                  <HStack gap={2}>
                    <CheckCircle size={14} color="#48BB78" />
                    <StarRatingDisplay
                      rating={playerRating.rating}
                      showCount={false}
                      size="xs"
                      variant="compact"
                    />
                  </HStack>
                ) : canRate ? (
                  <Button
                    size="xs"
                    colorPalette="orange"
                    onClick={() => handleRatePlayer(player)}
                  >
                    <Star size={12} />
                    {t('rated') || 'Rate'}
                  </Button>
                ) : (
                  <Badge colorPalette="gray" size="sm">
                    {t('cannotRate')}
                  </Badge>
                )}
              </HStack>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Rating Modal */}
      {selectedPlayer && (
        <SubmitRatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedPlayer(null);
          }}
          sessionId={sessionId}
          ratedUserId={selectedPlayer.userId!}
          ratedUserName={
            selectedPlayer.name || `Player ${selectedPlayer.playerNumber}`
          }
          ratedUserImage={selectedPlayer.user?.image || undefined}
          type={RatingType.HOST_TO_PLAYER}
          onSuccess={handleRatingSuccess}
        />
      )}
    </>
  );
};
