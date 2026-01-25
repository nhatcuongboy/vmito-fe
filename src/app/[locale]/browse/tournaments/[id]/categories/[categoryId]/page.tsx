'use client';

import {
  Card,
  CardBody,
  Divider,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@/components/ui/chakra-compat';
import TopBar from '@/components/ui/TopBar';
import { CategoryService } from '@/lib/api/category.service';
import {
  Category,
  CategoryMatch,
  CategoryRegistration,
  MatchStatus,
} from '@/lib/api/types';
import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { Trophy, Users } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function CategoryDetailPage() {
  const t = useTranslations('pages.tournaments.category');
  const tCategory = useTranslations('pages.tournaments.categoryTypeLabels');
  const params = useParams();
  const categoryId = params.categoryId as string;
  const tournamentId = params.id as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [registrations, setRegistrations] = useState<CategoryRegistration[]>(
    []
  );
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      loadCategory();
      loadRegistrations();
      loadMatches();
    }
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getCategory(categoryId);
      setCategory(data);
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    try {
      const data = await CategoryService.getRegistrations(categoryId);
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  };

  const loadMatches = async () => {
    try {
      const data = await CategoryService.getMatches(categoryId);
      setMatches(data);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const getMatchStatusColor = (status: MatchStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'yellow';
      case 'IN_PROGRESS':
        return 'green';
      case 'FINISHED':
        return 'gray';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCategoryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MENS_SINGLE: tCategory('mensSingle'),
      WOMENS_SINGLE: tCategory('womensSingle'),
      MENS_DOUBLE: tCategory('mensDouble'),
      WOMENS_DOUBLE: tCategory('womensDouble'),
      MIXED_DOUBLE: tCategory('mixedDouble'),
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Box minH="100vh">
        <TopBar
          showBackButton={true}
          backHref={`/tournaments/${tournamentId}`}
          title={t('title')}
        />
        <Flex justify="center" align="center" minH="80vh">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  if (!category) {
    return (
      <Box minH="100vh">
        <TopBar
          showBackButton={true}
          backHref={`/tournaments/${tournamentId}`}
          title={t('title')}
        />
        <Container maxW="7xl" p={4} pt={24}>
          <Text>{t('notFound')}</Text>
        </Container>
      </Box>
    );
  }

  // Group matches by round/group
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const key = match.groupId ? `Group ${match.groupId}` : match.round;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(match);
      return acc;
    },
    {} as Record<string, CategoryMatch[]>
  );

  return (
    <Box minH="100vh" pb="80px">
      <TopBar
        showBackButton={true}
        backHref={`/tournaments/${tournamentId}`}
        title={category.name}
      />

      <Container maxW="7xl" p={4} pt={24}>
        <VStack gap={6} alignItems="stretch">
          {/* Category Header */}
          <Card>
            <CardBody>
              <VStack align="stretch" gap={4}>
                <Flex
                  justify="space-between"
                  alignItems="start"
                  flexWrap="wrap"
                  gap={4}
                >
                  <VStack align="start" gap={2}>
                    <Heading size="lg">{category.name}</Heading>
                    <HStack>
                      <Badge colorPalette="blue">
                        {getCategoryTypeLabel(category.type)}
                      </Badge>
                      {category.hasGroupStage && (
                        <Badge colorPalette="purple">{t('groupStage')}</Badge>
                      )}
                      {category.matchFormat === 'BEST_OF_3' && (
                        <Badge colorPalette="green">{t('bestOf3')}</Badge>
                      )}
                      {category.matchFormat === 'BEST_OF_1' && (
                        <Badge colorPalette="orange">{t('bestOf1')}</Badge>
                      )}
                    </HStack>
                  </VStack>
                </Flex>

                <Divider />

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  {category._count && (
                    <>
                      <Flex alignItems="center" gap={2}>
                        <Users size={20} color="gray" />
                        <VStack align="start" gap={0}>
                          <Text fontSize="xs" color="gray.500">
                            {t('registrations')}
                          </Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {category._count?.registrations || 0}
                          </Text>
                        </VStack>
                      </Flex>

                      <Flex alignItems="center" gap={2}>
                        <Trophy size={20} color="gray" />
                        <VStack align="start" gap={0}>
                          <Text fontSize="xs" color="gray.500">
                            {t('matches')}
                          </Text>
                          <Text fontSize="sm" fontWeight="medium">
                            {category._count?.matches || 0}
                          </Text>
                        </VStack>
                      </Flex>

                      {category.hasGroupStage && (
                        <Flex alignItems="center" gap={2}>
                          <Trophy size={20} color="gray" />
                          <VStack align="start" gap={0}>
                            <Text fontSize="xs" color="gray.500">
                              {t('groups')}
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {category._count?.groups || 0}
                            </Text>
                          </VStack>
                        </Flex>
                      )}
                    </>
                  )}
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>

          {/* Registrations */}
          <Card>
            <CardBody>
              <VStack align="stretch" gap={4}>
                <Heading size="md">{t('participants')}</Heading>
                {registrations.length === 0 ? (
                  <Text color="gray.500">{t('noParticipantsYet')}</Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {registrations.map((registration) => (
                      <Card key={registration.id} variant="outline">
                        <CardBody>
                          <VStack align="start" gap={2}>
                            {registration.player ? (
                              <>
                                <Heading size="sm">
                                  {registration.player.name}
                                </Heading>
                                {registration.player.level && (
                                  <Badge>{registration.player.level}</Badge>
                                )}
                              </>
                            ) : registration.pair ? (
                              <>
                                <Heading size="sm">
                                  {registration.pair.name ||
                                    'Pair ' + registration.pair.id.slice(0, 8)}
                                </Heading>
                                {registration.pair.members && (
                                  <Text fontSize="sm" color="gray.600">
                                    {registration.pair.members
                                      .map((m) => m.player?.name || 'Unknown')
                                      .join(' & ')}
                                  </Text>
                                )}
                              </>
                            ) : (
                              <Text>Unknown</Text>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Matches */}
          <Card>
            <CardBody>
              <VStack align="stretch" gap={4}>
                <Heading size="md">{t('matches')}</Heading>
                {matches.length === 0 ? (
                  <Text color="gray.500">{t('noMatchesYet')}</Text>
                ) : (
                  <VStack align="stretch" gap={6}>
                    {Object.entries(matchesByRound).map(
                      ([round, roundMatches]) => (
                        <Box key={round}>
                          <Heading size="sm" mb={3}>
                            {round}
                          </Heading>
                          <TableContainer>
                            <Table variant="simple" size="sm">
                              <Thead>
                                <Tr>
                                  <Th>{t('match')}</Th>
                                  <Th>{t('participantsLabel')}</Th>
                                  <Th>{t('score')}</Th>
                                  <Th>{t('status')}</Th>
                                  <Th>{t('date')}</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {roundMatches.map((match) => (
                                  <Tr key={match.id}>
                                    <Td>#{match.matchNumber}</Td>
                                    <Td>
                                      {match.participants
                                        ?.map((p) => {
                                          if (p.categoryRegistration?.player) {
                                            return p.categoryRegistration.player
                                              .name;
                                          }
                                          if (p.categoryRegistration?.pair) {
                                            return (
                                              p.categoryRegistration.pair
                                                .name || t('pair')
                                            );
                                          }
                                          return t('unknown');
                                        })
                                        .join(t('vs'))}
                                    </Td>
                                    <Td>{match.score || '-'}</Td>
                                    <Td>
                                      <Badge
                                        colorPalette={getMatchStatusColor(
                                          match.status
                                        )}
                                      >
                                        {match.status}
                                      </Badge>
                                    </Td>
                                    <Td>
                                      {match.startTime
                                        ? format(
                                            new Date(match.startTime),
                                            'MMM dd, HH:mm'
                                          )
                                        : '-'}
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )
                    )}
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
