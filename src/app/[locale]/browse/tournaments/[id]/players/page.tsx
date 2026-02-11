'use client';

import TournamentLayout from '@/components/tournament/TournamentLayout';
import { TournamentService } from '@/lib/api/tournament.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import {
  Box,
  Container,
  Input,
  InputGroup,
  Spinner,
  Text,
  VStack,
  HStack,
  Grid,
  Flex,
} from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useState, useMemo } from 'react';
import { Tournament, TournamentPlayer } from '@/lib/api/types';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface GroupedPlayers {
  [key: string]: TournamentPlayer[];
}

// Vietnamese alphabet including Đ
const ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'Đ',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

// Get the first letter of the last name
const getLastNameFirstLetter = (name: string): string => {
  if (!name) return 'OTHER';
  const parts = name.trim().split(/\s+/);
  const lastName = parts[parts.length - 1] || name;
  const firstChar = lastName.charAt(0).toUpperCase();

  // Handle Vietnamese Đ
  if (firstChar === 'Đ') return 'Đ';

  // Normalize to standard alphabet
  if (ALPHABET.includes(firstChar)) {
    return firstChar;
  }

  return 'OTHER';
};

export default function TournamentPlayersPage() {
  const params = useParams();
  const locale = useLocale();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
      loadPlayers();
    }
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      const data = await TournamentService.getTournament(tournamentId);
      setTournament(data);
    } catch (error) {
      console.error('Error loading tournament:', error);
    }
  };

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const data = await TournamentPlayerService.getPlayers(tournamentId);
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and group players
  const groupedPlayers = useMemo(() => {
    let filtered = players;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = players.filter(
        (player) =>
          player.name?.toLowerCase().includes(query) ||
          player.email?.toLowerCase().includes(query) ||
          player.phone?.includes(query)
      );
    }

    // Group by first letter of last name
    const grouped: GroupedPlayers = {};
    filtered.forEach((player) => {
      const letter = getLastNameFirstLetter(player.name || '');
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(player);
    });

    // Sort players within each group by name
    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'vi');
      });
    });

    return grouped;
  }, [players, searchQuery]);

  // Get available letters (letters that have players)
  const availableLetters = useMemo(() => {
    return ALPHABET.filter((letter) => groupedPlayers[letter]?.length > 0);
  }, [groupedPlayers]);

  // Scroll to letter section
  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setActiveLetter(null), 1000);
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
        <VStack align="stretch" gap={6}>
          {/* Header with Search */}
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Text fontSize="2xl" fontWeight="bold">
              Players
            </Text>
            <Box position="relative" maxW="400px">
              <Box
                position="absolute"
                left="12px"
                top="50%"
                transform="translateY(-50%)"
                zIndex={1}
                pointerEvents="none"
              >
                <Search size={18} color="gray" />
              </Box>
              <Input
                placeholder="Search for players"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="md"
                pl="40px"
              />
            </Box>
          </Flex>

          {/* Players List */}
          {Object.keys(groupedPlayers).length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              {searchQuery
                ? 'No players found matching your search'
                : 'No players registered yet'}
            </Text>
          ) : (
            <Box position="relative">
              <Grid templateColumns="1fr auto" gap={6}>
                {/* Main Content - 3 columns */}
                <Box>
                  {ALPHABET.map((letter) => {
                    const letterPlayers = groupedPlayers[letter];
                    if (!letterPlayers || letterPlayers.length === 0) {
                      return null;
                    }

                    // Split into 3 columns
                    const column1: TournamentPlayer[] = [];
                    const column2: TournamentPlayer[] = [];
                    const column3: TournamentPlayer[] = [];

                    letterPlayers.forEach((player, index) => {
                      if (index % 3 === 0) {
                        column1.push(player);
                      } else if (index % 3 === 1) {
                        column2.push(player);
                      } else {
                        column3.push(player);
                      }
                    });

                    return (
                      <Box key={letter} id={`letter-${letter}`} mb={8}>
                        {/* Letter Header */}
                        <Text
                          fontSize="xl"
                          fontWeight="bold"
                          mb={4}
                          color="green.600"
                        >
                          {letter}
                        </Text>

                        {/* 3 Column Grid */}
                        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                          <VStack align="start" gap={2}>
                            {column1.map((player) => (
                              <Box key={player.id}>
                                <Link
                                  href={`/${locale}/tournaments/${tournamentId}/players/${player.id}`}
                                  style={{ textDecoration: 'none' }}
                                >
                                  <Text
                                    color="green.500"
                                    _hover={{ textDecoration: 'underline' }}
                                    cursor="pointer"
                                    fontSize="sm"
                                  >
                                    {player.name}
                                  </Text>
                                </Link>
                                {player.notes && (
                                  <Text fontSize="xs" color="gray.600" mt={0.5}>
                                    {player.notes}
                                  </Text>
                                )}
                              </Box>
                            ))}
                          </VStack>
                          <VStack align="start" gap={2}>
                            {column2.map((player) => (
                              <Box key={player.id}>
                                <Link
                                  href={`/${locale}/tournaments/${tournamentId}/players/${player.id}`}
                                  style={{ textDecoration: 'none' }}
                                >
                                  <Text
                                    color="green.500"
                                    _hover={{ textDecoration: 'underline' }}
                                    cursor="pointer"
                                    fontSize="sm"
                                  >
                                    {player.name}
                                  </Text>
                                </Link>
                                {player.notes && (
                                  <Text fontSize="xs" color="gray.600" mt={0.5}>
                                    {player.notes}
                                  </Text>
                                )}
                              </Box>
                            ))}
                          </VStack>
                          <VStack align="start" gap={2}>
                            {column3.map((player) => (
                              <Box key={player.id}>
                                <Link
                                  href={`/${locale}/tournaments/${tournamentId}/players/${player.id}`}
                                  style={{ textDecoration: 'none' }}
                                >
                                  <Text
                                    color="green.500"
                                    _hover={{ textDecoration: 'underline' }}
                                    cursor="pointer"
                                    fontSize="sm"
                                  >
                                    {player.name}
                                  </Text>
                                </Link>
                                {player.notes && (
                                  <Text fontSize="xs" color="gray.600" mt={0.5}>
                                    {player.notes}
                                  </Text>
                                )}
                              </Box>
                            ))}
                          </VStack>
                        </Grid>
                      </Box>
                    );
                  })}
                </Box>

                {/* Alphabetical Index */}
                <VStack
                  align="stretch"
                  gap={1}
                  position="sticky"
                  top="100px"
                  height="fit-content"
                >
                  {ALPHABET.map((letter) => {
                    const hasPlayers = availableLetters.includes(letter);
                    return (
                      <Box
                        key={letter}
                        as="button"
                        onClick={() => hasPlayers && scrollToLetter(letter)}
                        px={2}
                        py={1}
                        fontSize="xs"
                        fontWeight={
                          activeLetter === letter || hasPlayers
                            ? 'bold'
                            : 'normal'
                        }
                        color={
                          activeLetter === letter
                            ? 'blue.600'
                            : hasPlayers
                              ? 'blue.500'
                              : 'gray.400'
                        }
                        cursor={hasPlayers ? 'pointer' : 'default'}
                        _hover={
                          hasPlayers
                            ? {
                                color: 'blue.600',
                                bg: 'blue.50',
                                borderRadius: 'md',
                              }
                            : {}
                        }
                        transition="all 0.2s"
                        opacity={hasPlayers ? 1 : 0.5}
                      >
                        {letter}
                      </Box>
                    );
                  })}
                </VStack>
              </Grid>
            </Box>
          )}
        </VStack>
      </Container>
    </TournamentLayout>
  );
}
