'use client';

import TournamentLayout from '@/components/tournament/TournamentLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import {
  Box,
  Container,
  Spinner,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
  Flex,
  Grid,
} from '@chakra-ui/react';
import { Card, CardBody } from '@/components/ui/chakra-compat';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';
import { Tournament, TournamentPlayer, CategoryMatch } from '@/lib/api/types';
import { format } from 'date-fns';
import { MapPin, Info, Calendar } from 'lucide-react';

interface PlayerWithMatches extends TournamentPlayer {
  registrations?: Array<{
    category: {
      id: string;
      name: string;
      type: string;
    };
  }>;
}

export default function TournamentPlayerDetailPage() {
  const params = useParams();
  const _locale = useLocale();
  const tournamentId = params.id as string;
  const playerId = params.playerId as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [player, setPlayer] = useState<PlayerWithMatches | null>(null);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadData = async () => {
    try {
      setLoading(true);
      const [tournamentData, playerData, matchesData] = await Promise.all([
        TournamentService.getTournament(tournamentId),
        TournamentPlayerService.getPlayer(playerId),
        TournamentPlayerService.getPlayerMatches(playerId),
      ]);

      setTournament(tournamentData);
      setPlayer(playerData);
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId && playerId) {
      loadData();
    }
  }, [tournamentId, playerId]);

  // Calculate win-loss record
  const winLossRecord = useMemo(() => {
    const finishedMatches = matches.filter(
      (m) => m.status === 'FINISHED' && m.winnerId && !m.isDraw
    );

    let wins = 0;
    let losses = 0;

    finishedMatches.forEach((match) => {
      // Find player's participant
      const playerParticipant = match.participants?.find(
        (p) =>
          p.categoryRegistration?.player?.id === playerId ||
          p.categoryRegistration?.pair?.members?.some(
            (m) => m.player?.id === playerId
          )
      );

      if (playerParticipant && playerParticipant.categoryRegistration) {
        // Check if this registration's ID matches winnerId
        const registrationId = playerParticipant.categoryRegistration.id;
        if (match.winnerId === registrationId) {
          wins++;
        } else {
          losses++;
        }
      }
    });

    return { wins, losses, total: wins + losses };
  }, [matches, playerId]);

  // Get player's first letter for avatar
  const getInitial = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Format date
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'EEE M/d/yyyy h:mm a');
    } catch {
      return 'N/A';
    }
  };

  // Get opponent name from match
  const getOpponentName = (match: CategoryMatch) => {
    if (!match.participants || match.participants.length < 2) return 'Unknown';

    const playerParticipant = match.participants.find(
      (p) =>
        p.categoryRegistration?.player?.id === playerId ||
        p.categoryRegistration?.pair?.members?.some(
          (m) => m.player?.id === playerId
        )
    );

    const opponentParticipant = match.participants.find(
      (p) => p !== playerParticipant
    );

    if (!opponentParticipant) return 'Unknown';

    if (opponentParticipant.categoryRegistration?.player) {
      return opponentParticipant.categoryRegistration.player.name;
    }

    if (opponentParticipant.categoryRegistration?.pair) {
      const members =
        opponentParticipant.categoryRegistration.pair.members || [];
      return members.map((m) => m.player?.name || 'Unknown').join(' / ');
    }

    return 'Unknown';
  };

  // Get player scores from match
  const getPlayerScores = (match: CategoryMatch) => {
    const playerParticipant = match.participants?.find(
      (p) =>
        p.categoryRegistration?.player?.id === playerId ||
        p.categoryRegistration?.pair?.members?.some(
          (m) => m.player?.id === playerId
        )
    );

    if (!playerParticipant) return [];

    const position = playerParticipant.position;

    // If sets are available, use them
    if (match.sets && Array.isArray(match.sets)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (
        match.sets
          .map((set: any) => {
            if (position === 0) return set.player1Score;
            if (position === 1) return set.player2Score;
            if (position === 2) return set.player3Score;
            if (position === 3) return set.player4Score;
            return null;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((s: any) => s !== null && s !== undefined)
      );
    }

    // Fallback to total scores
    if (position === 0 && match.player1Score) return [match.player1Score];
    if (position === 1 && match.player2Score) return [match.player2Score];
    if (position === 2 && match.player3Score) return [match.player3Score];
    if (position === 3 && match.player4Score) return [match.player4Score];

    // If score string is available, parse it
    if (match.score) {
      // Simple parsing - assumes format like "21-19, 21-17"
      const scores = match.score.split(',').map((s: string) => {
        const parts = s.trim().split('-');
        return position === 0 ? parts[0] : parts[1];
      });
      return scores.filter((s: string) => s);
    }

    return [];
  };

  // Get opponent scores from match
  const getOpponentScores = (match: CategoryMatch) => {
    const playerParticipant = match.participants?.find(
      (p) =>
        p.categoryRegistration?.player?.id === playerId ||
        p.categoryRegistration?.pair?.members?.some(
          (m) => m.player?.id === playerId
        )
    );

    if (!playerParticipant) return [];

    const _playerPosition = playerParticipant.position;
    const opponentParticipant = match.participants?.find(
      (p) => p !== playerParticipant
    );

    if (!opponentParticipant) return [];

    const opponentPosition = opponentParticipant.position;

    // If sets are available, use them
    if (match.sets && Array.isArray(match.sets)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (
        match.sets
          .map((set: any) => {
            if (opponentPosition === 0) return set.player1Score;
            if (opponentPosition === 1) return set.player2Score;
            if (opponentPosition === 2) return set.player3Score;
            if (opponentPosition === 3) return set.player4Score;
            return null;
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((s: any) => s !== null && s !== undefined)
      );
    }

    // Fallback to total scores
    if (opponentPosition === 0 && match.player1Score)
      return [match.player1Score];
    if (opponentPosition === 1 && match.player2Score)
      return [match.player2Score];
    if (opponentPosition === 2 && match.player3Score)
      return [match.player3Score];
    if (opponentPosition === 3 && match.player4Score)
      return [match.player4Score];

    // If score string is available, parse it
    if (match.score) {
      const scores = match.score.split(',').map((s: string) => {
        const parts = s.trim().split('-');
        return opponentPosition === 0 ? parts[0] : parts[1];
      });
      return scores.filter((s: string) => s);
    }

    return [];
  };

  // Get category name for display
  const getCategoryDisplayName = (
    match: CategoryMatch & {
      category?: { id: string; name: string; type: string };
    }
  ) => {
    if (!match.category) return 'Unknown';
    return match.category.name;
  };

  if (loading || !tournament || !player) {
    return (
      <VStack minH="100vh" justify="center">
        <Spinner size="xl" />
      </VStack>
    );
  }

  /* const winRate =
    winLossRecord.total > 0
      ? ((winLossRecord.wins / winLossRecord.total) * 100).toFixed(0)
      : '0'; */

  return (
    <TournamentLayout tournament={tournament}>
      <Container maxW="7xl" px={4} py={8}>
        <VStack align="stretch" gap={6}>
          {/* Player Header Card */}
          <Card bg="gray.800" color="white">
            <CardBody>
              <Flex gap={6} align="center" flexWrap="wrap">
                {/* Avatar */}
                <Box
                  w="80px"
                  h="80px"
                  borderRadius="full"
                  bg="blue.500"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  {getInitial(player.name)}
                </Box>

                {/* Player Info */}
                <VStack align="start" gap={2} flex={1}>
                  <HStack gap={2}>
                    <Heading size="lg" color="white">
                      {player.name}
                    </Heading>
                    {player.id && (
                      <Text fontSize="sm" color="gray.300">
                        ({player.id.slice(-10)})
                      </Text>
                    )}
                  </HStack>
                  {player.registrations && player.registrations.length > 0 && (
                    <Text fontSize="sm" color="gray.300">
                      {player.registrations
                        .map((r) => r.category.name)
                        .join(', ')}
                    </Text>
                  )}
                </VStack>

                {/* Win-Loss Record */}
                <VStack align="end" gap={2}>
                  <Text fontSize="sm" color="gray.300">
                    Win-Loss
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {winLossRecord.wins}-{winLossRecord.losses} (
                    {winLossRecord.total})
                  </Text>
                  <Box
                    w="100px"
                    h="8px"
                    bg="gray.700"
                    borderRadius="md"
                    overflow="hidden"
                  >
                    <Box
                      h="100%"
                      bg="green.500"
                      w={`${winLossRecord.total > 0 ? (winLossRecord.wins / winLossRecord.total) * 100 : 0}%`}
                      transition="width 0.3s"
                    />
                  </Box>
                </VStack>
              </Flex>
            </CardBody>
          </Card>

          {/* Matches Section */}
          <Box>
            <Heading size="md" mb={4}>
              Matches
            </Heading>

            {matches.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No matches found
              </Text>
            ) : (
              <VStack align="stretch" gap={4}>
                {matches.map((match) => {
                  const opponentName = getOpponentName(match);
                  const playerScores = getPlayerScores(match);
                  const opponentScores = getOpponentScores(match);

                  // Check if player won
                  const playerParticipant = match.participants?.find(
                    (p) =>
                      p.categoryRegistration?.player?.id === playerId ||
                      p.categoryRegistration?.pair?.members?.some(
                        (m) => m.player?.id === playerId
                      )
                  );

                  const isWinner =
                    match.winnerId &&
                    playerParticipant?.categoryRegistration?.id ===
                      match.winnerId;

                  return (
                    <Card key={match.id} variant="outline">
                      <CardBody>
                        <VStack align="stretch" gap={3}>
                          {/* Round Info */}
                          <HStack justify="space-between" flexWrap="wrap">
                            <Text fontSize="sm" color="gray.600">
                              {match.round} • {getCategoryDisplayName(match)}
                            </Text>
                            <HStack gap={2}>
                              <Badge
                                colorPalette={
                                  match.status === 'FINISHED'
                                    ? 'green'
                                    : match.status === 'IN_PROGRESS'
                                      ? 'blue'
                                      : 'gray'
                                }
                              >
                                {match.status}
                              </Badge>
                            </HStack>
                          </HStack>

                          {/* Players and Scores */}
                          <Grid
                            templateColumns="1fr auto 1fr"
                            gap={4}
                            alignItems="center"
                          >
                            {/* Player Name */}
                            <VStack align="start" gap={1}>
                              <Text fontWeight="medium">{player.name}</Text>
                              {playerScores.length > 0 && (
                                <HStack gap={2}>
                                  {playerScores.map((score, idx) => (
                                    <Text
                                      key={idx}
                                      fontSize="sm"
                                      color={isWinner ? 'green.600' : 'red.600'}
                                    >
                                      {score}
                                    </Text>
                                  ))}
                                </HStack>
                              )}
                            </VStack>

                            {/* VS */}
                            <Text fontSize="sm" color="gray.500">
                              vs
                            </Text>

                            {/* Opponent */}
                            <VStack align="end" gap={1}>
                              <Text fontWeight="medium">{opponentName}</Text>
                              {opponentScores.length > 0 && (
                                <HStack gap={2}>
                                  {opponentScores.map((score, idx) => (
                                    <Text
                                      key={idx}
                                      fontSize="sm"
                                      color={
                                        !isWinner ? 'green.600' : 'red.600'
                                      }
                                    >
                                      {score}
                                    </Text>
                                  ))}
                                </HStack>
                              )}
                            </VStack>
                          </Grid>

                          {/* Match Info */}
                          <HStack
                            justify="space-between"
                            fontSize="xs"
                            color="gray.500"
                            flexWrap="wrap"
                          >
                            <HStack gap={4}>
                              {match.startTime && (
                                <HStack gap={1}>
                                  <Calendar size={14} />
                                  <Text>{formatDate(match.startTime)}</Text>
                                </HStack>
                              )}
                              {match.court && (
                                <HStack gap={1}>
                                  <MapPin size={14} />
                                  <Text>
                                    {match.court.courtName ||
                                      `Court ${match.court.courtNumber}`}
                                  </Text>
                                </HStack>
                              )}
                            </HStack>
                            <HStack gap={2}>
                              <Info size={14} />
                              <Text>H2H</Text>
                            </HStack>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </TournamentLayout>
  );
}
