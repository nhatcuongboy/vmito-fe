'use client';

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Input,
} from '@chakra-ui/react';
import {
  Card,
  CardBody,
  SimpleGrid,
  Button,
} from '@/components/ui/chakra-compat';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { TournamentService } from '@/lib/api/tournament.service';
import { Tournament, TournamentStatus } from '@/lib/api/types';
import { useEffect, useState } from 'react';
import { Calendar, Users, Trophy, Plus, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toaster } from '@/components/ui/toaster';
import { api } from '@/lib/api/base';

export default function TournamentsPage() {
  const t = useTranslations('pages.tournaments');
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [creatingSample, setCreatingSample] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await TournamentService.getAllTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSample = async () => {
    try {
      setCreatingSample(true);
      const response = await api.post('/tournaments/create-sample');
      const result = response.data.data;

      toaster.success({ title: t('sampleCreatedSuccess') });
      // Reload tournaments
      await loadTournaments();
      // Navigate to the new tournament
      router.push(`/tournaments/${result.tournament.id}`);
    } catch (error: any) {
      console.error('Error creating sample tournament:', error);
      toaster.error({
        title:
          error.response?.data?.error || 'Failed to create sample tournament',
      });
    } finally {
      setCreatingSample(false);
    }
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'PREPARING':
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

  const getStatusLabel = (status: TournamentStatus) => {
    switch (status) {
      case 'PREPARING':
        return t('status.preparing');
      case 'IN_PROGRESS':
        return t('status.inProgress');
      case 'FINISHED':
        return t('status.finished');
      case 'CANCELLED':
        return t('status.cancelled');
      default:
        return status;
    }
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box minH="100vh" pb="80px">
      <TopBar showBackButton={true} backHref="/" title={t('title')} />

      <Container maxW="7xl" p={4} pt={24}>
        <VStack gap={6} alignItems="stretch">
          {/* Header */}
          <Flex
            justify="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={4}
          >
            <Heading size="lg">{t('allTournaments')}</Heading>
            <HStack gap={2}>
              <Button
                onClick={handleCreateSample}
                colorScheme="purple"
                variant="outline"
                leftIcon={<Sparkles size={16} />}
                loading={creatingSample}
              >
                {creatingSample ? t('creating') : t('createSample')}
              </Button>
              <NextLinkButton
                href="/tournaments/new"
                colorScheme="blue"
                leftIcon={<Plus size={16} />}
              >
                {t('createTournament')}
              </NextLinkButton>
            </HStack>
          </Flex>

          {/* Filters */}
          <Flex gap={4} flexWrap="wrap">
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxW="300px"
            />
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value)
              }
              style={{
                maxWidth: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                borderWidth: '1px',
                borderColor: '#CBD5E0',
              }}
            >
              <option value="ALL">{t('allStatus')}</option>
              <option value="PREPARING">{t('status.preparing')}</option>
              <option value="IN_PROGRESS">{t('status.inProgress')}</option>
              <option value="FINISHED">{t('status.finished')}</option>
              <option value="CANCELLED">{t('status.cancelled')}</option>
            </select>
          </Flex>

          {/* Loading State */}
          {loading ? (
            <Flex justify="center" py={10}>
              <Spinner size="lg" />
            </Flex>
          ) : (
            <>
              {/* Tournaments Grid */}
              {filteredTournaments.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text color="gray.500" fontSize="lg">
                    {t('noTournamentsFound')}
                  </Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredTournaments.map((tournament) => (
                    <Card
                      key={tournament.id}
                      as={NextLinkButton}
                      href={`/tournaments/${tournament.id}`}
                      bg="white"
                      borderWidth="1px"
                      borderColor="gray.200"
                      borderRadius="lg"
                      overflow="hidden"
                      _hover={{
                        shadow: 'xl',
                        transform: 'translateY(-4px)',
                        transition: 'all 0.3s',
                        borderColor: 'blue.300',
                      }}
                      cursor="pointer"
                    >
                      <CardBody p={5}>
                        <VStack align="stretch" gap={4}>
                          {/* Header with name and status */}
                          <Flex
                            justify="space-between"
                            alignItems="start"
                            gap={3}
                          >
                            <Heading
                              size="md"
                              color="gray.800"
                              fontWeight="bold"
                              flex={1}
                            >
                              {tournament.name}
                            </Heading>
                            <Badge
                              colorScheme={getStatusColor(tournament.status)}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="md"
                              flexShrink={0}
                            >
                              {getStatusLabel(tournament.status)}
                            </Badge>
                          </Flex>

                          {/* Date */}
                          <Flex
                            alignItems="center"
                            gap={2}
                            p={2}
                            bg="gray.50"
                            borderRadius="md"
                          >
                            <Calendar
                              size={18}
                              color="var(--chakra-colors-blue-500)"
                            />
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color="gray.700"
                            >
                              {format(
                                new Date(tournament.startDate),
                                'MMM dd, yyyy'
                              )}
                            </Text>
                          </Flex>

                          {/* Stats */}
                          {tournament._count && (
                            <HStack
                              gap={4}
                              p={2}
                              bg="gray.50"
                              borderRadius="md"
                              flexWrap="wrap"
                            >
                              <Flex alignItems="center" gap={2}>
                                <Trophy
                                  size={18}
                                  color="var(--chakra-colors-yellow-500)"
                                />
                                <Text
                                  fontSize="sm"
                                  fontWeight="medium"
                                  color="gray.700"
                                >
                                  {tournament._count.categories}{' '}
                                  {t('categories')}
                                </Text>
                              </Flex>
                              <Flex alignItems="center" gap={2}>
                                <Users
                                  size={18}
                                  color="var(--chakra-colors-green-500)"
                                />
                                <Text
                                  fontSize="sm"
                                  fontWeight="medium"
                                  color="gray.700"
                                >
                                  {tournament._count.players} {t('players')}
                                </Text>
                              </Flex>
                            </HStack>
                          )}

                          {/* Host */}
                          {tournament.host && (
                            <Box
                              pt={2}
                              borderTopWidth="1px"
                              borderTopColor="gray.200"
                            >
                              <Text
                                fontSize="sm"
                                color="gray.600"
                                fontWeight="medium"
                              >
                                {t('host')}:{' '}
                                <Text as="span" color="gray.800">
                                  {tournament.host.name}
                                </Text>
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
