'use client';

import TournamentLayout from '@/components/tournament/TournamentLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { Container, Spinner, Text, VStack } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Tournament } from '@/lib/api/types';

export default function TournamentMatchesPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      setLoading(true);
      const data = await TournamentService.getTournament(tournamentId);
      setTournament(data);
    } catch (error) {
      console.error('Error loading tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !tournament) {
    return (
      <VStack minH="100vh" justify="center">
        <Spinner size="xl" />
      </VStack>
    );
  }

  return (
    <TournamentLayout tournament={tournament}>
      <Container maxW="7xl" px={4} py={8}>
        <VStack align="stretch" gap={4}>
          <Text fontSize="2xl" fontWeight="bold">
            Matches
          </Text>
          <Text>Matches content will be displayed here</Text>
        </VStack>
      </Container>
    </TournamentLayout>
  );
}

