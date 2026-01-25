'use client';

import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import {
  Card,
  CardBody,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@/components/ui/chakra-compat';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentService } from '@/lib/api/tournament.service';
import {
  Category,
  Tournament,
  TournamentStatus,
  UserRole,
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
import {
  Calendar,
  Gavel,
  MapPin,
  Settings,
  Tablet,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function TournamentManagePage() {
  const t = useTranslations('pages.tournaments.manage');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
      loadCategories();
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

  const loadCategories = async () => {
    try {
      const data = await CategoryService.getCategories(tournamentId);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.PREPARING:
        return 'yellow';
      case TournamentStatus.IN_PROGRESS:
        return 'green';
      case TournamentStatus.FINISHED:
        return 'gray';
      case TournamentStatus.CANCELLED:
        return 'red';
      default:
        return 'gray';
    }
  };

  const tStatus = useTranslations('pages.tournaments.status');
  const tCategory = useTranslations('pages.tournaments.categoryTypeLabels');

  const getStatusLabel = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.PREPARING:
        return tStatus('preparing');
      case TournamentStatus.IN_PROGRESS:
        return tStatus('inProgress');
      case TournamentStatus.FINISHED:
        return tStatus('finished');
      case TournamentStatus.CANCELLED:
        return tStatus('cancelled');
      default:
        return status;
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
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
        <Box minH="100vh">
          <TopBar
            showBackButton={true}
            backHref={`/browse/tournaments`}
            title={t('title')}
          />
          <Flex justify="center" align="center" minH="80vh">
            <Spinner size="xl" />
          </Flex>
        </Box>
      </ProtectedRouteGuard>
    );
  }

  if (!tournament) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
        <Box minH="100vh">
          <TopBar
            showBackButton={true}
            backHref={`/browse/tournaments`}
            title={t('title')}
          />
          <Container maxW="7xl" p={4} pt={24}>
            <Text>{t('notFound')}</Text>
          </Container>
        </Box>
      </ProtectedRouteGuard>
    );
  }

  // Check if user is the host
  const isHost = user?.role === UserRole.HOST;
  const canManage =
    (isHost && tournament.hostId === user?.id) || user?.role === UserRole.ADMIN;

  if (!canManage) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
        <Box minH="100vh">
          <TopBar
            showBackButton={true}
            backHref={`/browse/tournaments`}
            title={t('title')}
          />
          <Container maxW="7xl" p={4} pt={24}>
            <Text>{t('noPermission')}</Text>
          </Container>
        </Box>
      </ProtectedRouteGuard>
    );
  }

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Box minH="100vh" pb="80px">
        <TopBar
          showBackButton={true}
          backHref={`/browse/tournaments`}
          title={`Manage: ${tournament.name}`}
        />

        <Container maxW="7xl" p={4} pt={24}>
          <VStack gap={6} alignItems="stretch">
            {/* Tournament Header */}
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
                      <Heading size="lg">{tournament.name}</Heading>
                      <HStack>
                        <Badge colorPalette={getStatusColor(tournament.status)}>
                          {getStatusLabel(tournament.status)}
                        </Badge>
                      </HStack>
                    </VStack>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Flex alignItems="center" gap={2}>
                      <Calendar size={20} color="gray" />
                      <VStack align="start" gap={0}>
                        <Text fontSize="xs" color="gray.500">
                          {t('startDate')}
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {format(
                            new Date(tournament.startDate),
                            'MMM dd, yyyy'
                          )}
                        </Text>
                      </VStack>
                    </Flex>

                    <Flex alignItems="center" gap={2}>
                      <Calendar size={20} color="gray" />
                      <VStack align="start" gap={0}>
                        <Text fontSize="xs" color="gray.500">
                          {t('endDate')}
                        </Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {format(new Date(tournament.endDate), 'MMM dd, yyyy')}
                        </Text>
                      </VStack>
                    </Flex>

                    {tournament._count && (
                      <>
                        <Flex alignItems="center" gap={2}>
                          <Trophy size={20} color="gray" />
                          <VStack align="start" gap={0}>
                            <Text fontSize="xs" color="gray.500">
                              {t('categories')}
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {tournament._count.categories}
                            </Text>
                          </VStack>
                        </Flex>

                        <Flex alignItems="center" gap={2}>
                          <Users size={20} color="gray" />
                          <VStack align="start" gap={0}>
                            <Text fontSize="xs" color="gray.500">
                              {t('players')}
                            </Text>
                            <Text fontSize="sm" fontWeight="medium">
                              {tournament._count.players}
                            </Text>
                          </VStack>
                        </Flex>
                      </>
                    )}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>

            {/* Tabs */}
            <Tabs variant="enclosed" colorPalette="blue">
              <TabList flexWrap="wrap">
                <Tab>
                  <HStack gap={2}>
                    <Settings size={16} />
                    <Text>{t('overview')}</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack gap={2}>
                    <Trophy size={16} />
                    <Text>{t('categories')}</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack gap={2}>
                    <UserPlus size={16} />
                    <Text>{t('players')}</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack gap={2}>
                    <UsersRound size={16} />
                    <Text>{t('pairs')}</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack gap={2}>
                    <Gavel size={16} />
                    <Text>{t('umpires')}</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack gap={2}>
                    <Tablet size={16} />
                    <Text>{t('scoringDevices')}</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack gap={2}>
                    <MapPin size={16} />
                    <Text>{t('courts')}</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel>
                  <VStack align="stretch" gap={4}>
                    <Heading size="md">{t('tournamentOverview')}</Heading>
                    <Text>{t('overviewDescription')}</Text>
                  </VStack>
                </TabPanel>

                {/* Categories Tab */}
                <TabPanel>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('categories')}</Heading>
                      <NextLinkButton
                        href={`/host/tournaments/${tournamentId}/categories/new`}
                        size="sm"
                        leftIcon={<Trophy size={16} />}
                      >
                        {t('addCategory')}
                      </NextLinkButton>
                    </Flex>

                    {categories.length === 0 ? (
                      <Text color="gray.500">{t('noCategoriesYet')}</Text>
                    ) : (
                      <SimpleGrid
                        columns={{ base: 1, md: 2, lg: 3 }}
                        spacing={4}
                      >
                        {categories.map((category) => (
                          <Card key={category.id} variant="outline">
                            <CardBody>
                              <VStack align="stretch" gap={3}>
                                <Flex
                                  justify="space-between"
                                  alignItems="start"
                                >
                                  <Heading size="sm">{category.name}</Heading>
                                  <Badge colorPalette="blue">
                                    {getCategoryTypeLabel(category.type)}
                                  </Badge>
                                </Flex>
                                {category._count && (
                                  <Text fontSize="sm" color="gray.600">
                                    {category._count.registrations}{' '}
                                    Registrations • {category._count.matches}{' '}
                                    Matches
                                  </Text>
                                )}
                                <NextLinkButton
                                  href={`/host/tournaments/${tournamentId}/categories/${category.id}`}
                                  size="sm"
                                  variant="outline"
                                  w="full"
                                >
                                  {t('manageButton')}
                                </NextLinkButton>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </SimpleGrid>
                    )}
                  </VStack>
                </TabPanel>

                {/* Players Tab */}
                <TabPanel>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('players')}</Heading>
                      <NextLinkButton
                        href={`/host/tournaments/${tournamentId}/players`}
                        size="sm"
                        leftIcon={<UserPlus size={16} />}
                      >
                        {t('managePlayers')}
                      </NextLinkButton>
                    </Flex>
                    <Text color="gray.500">
                      {t('managePlayersDescription')}
                    </Text>
                  </VStack>
                </TabPanel>

                {/* Pairs Tab */}
                <TabPanel>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('pairs')}</Heading>
                      <NextLinkButton
                        href={`/host/tournaments/${tournamentId}/pairs`}
                        size="sm"
                        leftIcon={<UsersRound size={16} />}
                      >
                        {t('managePairs')}
                      </NextLinkButton>
                    </Flex>
                    <Text color="gray.500">{t('managePairsDescription')}</Text>
                  </VStack>
                </TabPanel>

                {/* Umpires Tab */}
                <TabPanel>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('umpires')}</Heading>
                      <Text color="gray.500">{t('umpiresDescription')}</Text>
                    </Flex>
                  </VStack>
                </TabPanel>

                {/* Scoring Devices Tab */}
                <TabPanel>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('scoringDevices')}</Heading>
                      <Text color="gray.500">
                        {t('scoringDevicesDescription')}
                      </Text>
                    </Flex>
                  </VStack>
                </TabPanel>

                {/* Courts Tab */}
                <TabPanel>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">{t('courts')}</Heading>
                      <Text color="gray.500">{t('courtsDescription')}</Text>
                    </Flex>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>
    </ProtectedRouteGuard>
  );
}
