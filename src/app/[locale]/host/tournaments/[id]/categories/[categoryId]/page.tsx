'use client';
import { Input } from '@/components/ui/Input';

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Badge,
  Field,
  useDisclosure,
} from '@chakra-ui/react';
import {
  Card,
  CardBody,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  IconButton,
} from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import TopBar from '@/components/ui/TopBar';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { CategoryService } from '@/lib/api/category.service';
import { TournamentPlayerService } from '@/lib/api/tournament-player.service';
import { TournamentPairService } from '@/lib/api/tournament-pair.service';
import {
  Category,
  CategoryRegistration,
  CategoryMatch,
  CategoryGroup,
  CategoryGroupRegistration,
  TournamentPlayer,
  TournamentPair,
  TournamentUmpire,
  TournamentCourt,
  TournamentScoringDevice,
  MatchFormat,
  CategoryType,
  MatchStatus,
} from '@/lib/api/types';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import {
  Save,
  Plus,
  X,
  Play,
  Square,
  Trophy,
  Users,
  Settings,
} from 'lucide-react';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { UserRole } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { format } from 'date-fns';

export default function CategoryManagePage() {
  const t = useTranslations('pages.tournaments.categoryManage');
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const tournamentId = params.id as string;
  const categoryId = params.categoryId as string;
  const [category, setCategory] = useState<Category | null>(null);
  const [registrations, setRegistrations] = useState<CategoryRegistration[]>(
    []
  );
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [matches, setMatches] = useState<CategoryMatch[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [pairs, setPairs] = useState<TournamentPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    hasGroupStage: false,
    averageMatchDuration: 0,
    groupCount: 0,
    winnersPerGroup: 0,
    matchFormat: MatchFormat.BEST_OF_3,
  });
  const {
    open: isRegistrationOpen,
    onOpen: onRegistrationOpen,
    onClose: onRegistrationClose,
  } = useDisclosure();

  const handleRegistrationClose = () => {
    setSelectedRegistration(null);
    onRegistrationClose();
  };
  const {
    open: isMatchOpen,
    onOpen: onMatchOpen,
    onClose: onMatchClose,
  } = useDisclosure();
  const [selectedRegistration, setSelectedRegistration] = useState<
    string | null
  >(null);
  const [matchFormData, setMatchFormData] = useState({
    round: '',
    matchNumber: 1,
    participant1Id: '',
    participant2Id: '',
    courtId: '',
    startTime: '',
    matchFormat: MatchFormat.BEST_OF_3,
  });

  useEffect(() => {
    if (categoryId) {
      loadCategory();
      loadRegistrations();
      loadGroups();
      loadMatches();
      loadPlayers();
      loadPairs();
    }
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getCategory(categoryId);
      setCategory(data);
      setFormData({
        hasGroupStage: data.hasGroupStage,
        averageMatchDuration: data.averageMatchDuration || 0,
        groupCount: data.groupCount || 0,
        winnersPerGroup: data.winnersPerGroup || 0,
        matchFormat: data.matchFormat,
      });
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

  const loadPlayers = async () => {
    try {
      const data = await TournamentPlayerService.getPlayers(tournamentId);
      setPlayers(data);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadPairs = async () => {
    try {
      const data = await TournamentPairService.getPairs(tournamentId);
      setPairs(data);
    } catch (error) {
      console.error('Error loading pairs:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await CategoryService.getGroups(categoryId);
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await CategoryService.updateCategory(categoryId, formData);
      await loadCategory();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRegistration = async () => {
    if (!selectedRegistration) return;
    try {
      const isSingle =
        category?.type === CategoryType.MENS_SINGLE ||
        category?.type === CategoryType.WOMENS_SINGLE;
      const data = isSingle
        ? { tournamentPlayerId: selectedRegistration }
        : { tournamentPairId: selectedRegistration };
      await CategoryService.createRegistration(categoryId, data);
      handleRegistrationClose();
      loadRegistrations();
    } catch (error) {
      console.error('Error adding registration:', error);
    }
  };

  const handleRemoveRegistration = async (registrationId: string) => {
    if (!confirm(t('removeRegistrationConfirmation'))) return;
    try {
      await CategoryService.deleteRegistration(categoryId, registrationId);
      loadRegistrations();
    } catch (error) {
      console.error('Error removing registration:', error);
    }
  };

  const handleCreateMatch = () => {
    setMatchFormData({
      round: category?.hasGroupStage ? 'Group Stage' : 'Round 1',
      matchNumber: matches.length + 1,
      participant1Id: '',
      participant2Id: '',
      courtId: '',
      startTime: '',
      matchFormat: category?.matchFormat || MatchFormat.BEST_OF_3,
    });
    onMatchOpen();
  };

  const handleSaveMatch = async () => {
    if (!matchFormData.participant1Id || !matchFormData.participant2Id) {
      alert(t('selectBothParticipants'));
      return;
    }

    const reg1 = registrations.find((r) =>
      category?.type === CategoryType.MENS_SINGLE ||
      category?.type === CategoryType.WOMENS_SINGLE
        ? r.tournamentPlayerId === matchFormData.participant1Id
        : r.tournamentPairId === matchFormData.participant1Id
    );
    const reg2 = registrations.find((r) =>
      category?.type === CategoryType.MENS_SINGLE ||
      category?.type === CategoryType.WOMENS_SINGLE
        ? r.tournamentPlayerId === matchFormData.participant2Id
        : r.tournamentPairId === matchFormData.participant2Id
    );

    if (!reg1 || !reg2) {
      alert(t('invalidParticipants'));
      return;
    }

    try {
      await CategoryService.createMatch(categoryId, {
        round: matchFormData.round,
        matchNumber: matchFormData.matchNumber,
        participants: [
          { categoryRegistrationId: reg1.id, position: 1 },
          { categoryRegistrationId: reg2.id, position: 2 },
        ],
        courtId: matchFormData.courtId || undefined,
        startTime: matchFormData.startTime
          ? new Date(matchFormData.startTime)
          : undefined,
        matchFormat: matchFormData.matchFormat,
      });
      onMatchClose();
      loadMatches();
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const tCategory = useTranslations('pages.tournaments.categoryTypeLabels');

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

  if (loading) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
        <Box minH="100vh">
          <TopBar
            showBackButton={true}
            backHref={`/host/tournaments/${tournamentId}`}
            title={t('title')}
          />
          <Flex justify="center" align="center" minH="80vh">
            <Spinner size="xl" />
          </Flex>
        </Box>
      </ProtectedRouteGuard>
    );
  }

  if (!category) {
    return (
      <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
        <Box minH="100vh">
          <TopBar
            showBackButton={true}
            backHref={`/host/tournaments/${tournamentId}`}
            title={t('title')}
          />
          <Container maxW="7xl" p={4} pt={24}>
            <Text>{t('notFound')}</Text>
          </Container>
        </Box>
      </ProtectedRouteGuard>
    );
  }

  const isSingle =
    category.type === CategoryType.MENS_SINGLE ||
    category.type === CategoryType.WOMENS_SINGLE;

  // Filter players/pairs by category type
  let filteredPlayers = players;
  let filteredPairs = pairs;

  if (isSingle) {
    // Filter players by gender for single categories
    if (category.type === CategoryType.MENS_SINGLE) {
      filteredPlayers = players.filter((p) => p.gender === 'MALE');
    } else if (category.type === CategoryType.WOMENS_SINGLE) {
      filteredPlayers = players.filter((p) => p.gender === 'FEMALE');
    }
  } else {
    // Filter pairs by type for double categories
    filteredPairs = pairs.filter((pair) => pair.type === category.type);
  }

  const availableForRegistration = isSingle ? filteredPlayers : filteredPairs;

  // Filter out already registered items
  const registeredIds = new Set(
    registrations.map((reg) =>
      isSingle ? reg.tournamentPlayerId : reg.tournamentPairId
    )
  );
  const availableItems = availableForRegistration.filter(
    (item) => !registeredIds.has(item.id)
  );

  return (
    <ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
      <Box minH="100vh" pb="80px">
        <TopBar
          showBackButton={true}
          backHref={`/host/tournaments/${tournamentId}`}
          title={`Manage: ${category.name}`}
        />

        <Container maxW="7xl" p={4} pt={24}>
          <VStack gap={6} alignItems="stretch">
            {/* Category Header */}
            <Card>
              <CardBody>
                <VStack align="stretch" gap={2}>
                  <Heading size="lg">{category.name}</Heading>
                  <Badge colorPalette="green" w="fit-content">
                    {getCategoryTypeLabel(category.type)}
                  </Badge>
                </VStack>
              </CardBody>
            </Card>

            {/* Step Navigation */}
            {category.hasGroupStage && (
              <Card>
                <CardBody>
                  <HStack
                    gap={4}
                    flexWrap="wrap"
                    justifyContent="center"
                    fontSize="sm"
                  >
                    <HStack
                      gap={2}
                      color={activeTab === 0 ? 'blue.600' : 'gray.500'}
                      borderBottom={
                        activeTab === 0 ? '2px solid' : '2px solid transparent'
                      }
                      borderColor={activeTab === 0 ? 'blue.600' : 'transparent'}
                      pb={2}
                      cursor="pointer"
                      onClick={() => setActiveTab(0)}
                    >
                      <Text fontWeight={activeTab === 0 ? 'bold' : 'normal'}>
                        1 {t('basicSettings')}
                      </Text>
                    </HStack>
                    <HStack
                      gap={2}
                      color={activeTab === 1 ? 'blue.600' : 'gray.500'}
                      borderBottom={
                        activeTab === 1 ? '2px solid' : '2px solid transparent'
                      }
                      borderColor={activeTab === 1 ? 'blue.600' : 'transparent'}
                      pb={2}
                      cursor="pointer"
                      onClick={() => setActiveTab(1)}
                    >
                      <Text fontWeight={activeTab === 1 ? 'bold' : 'normal'}>
                        2 {t('playerRegistration')}
                      </Text>
                    </HStack>
                    <HStack
                      gap={2}
                      color={activeTab === 2 ? 'blue.600' : 'gray.500'}
                      borderBottom={
                        activeTab === 2 ? '2px solid' : '2px solid transparent'
                      }
                      borderColor={activeTab === 2 ? 'blue.600' : 'transparent'}
                      pb={2}
                      cursor="pointer"
                      onClick={() => setActiveTab(2)}
                    >
                      <Text fontWeight={activeTab === 2 ? 'bold' : 'normal'}>
                        3 {t('groupDivision')}
                      </Text>
                    </HStack>
                    <HStack
                      gap={2}
                      color={activeTab === 3 ? 'blue.600' : 'gray.500'}
                      borderBottom={
                        activeTab === 3 ? '2px solid' : '2px solid transparent'
                      }
                      borderColor={activeTab === 3 ? 'blue.600' : 'transparent'}
                      pb={2}
                      cursor="pointer"
                      onClick={() => setActiveTab(3)}
                    >
                      <Text fontWeight={activeTab === 3 ? 'bold' : 'normal'}>
                        4 {t('groupStage')}
                      </Text>
                    </HStack>
                    <HStack
                      gap={2}
                      color="gray.400"
                      borderBottom="2px solid transparent"
                      pb={2}
                    >
                      <Text>5 {t('knockoutStage')}</Text>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            )}

            {/* Tabs */}
            <Tabs
              variant="enclosed"
              colorPalette="green"
              index={category.hasGroupStage ? activeTab : undefined}
              onChange={category.hasGroupStage ? setActiveTab : undefined}
            >
              <TabList flexWrap="wrap">
                <Tab>
                  {category.hasGroupStage ? t('basicSettings') : t('settings')}
                </Tab>
                <Tab>{t('registrations')}</Tab>
                {category.hasGroupStage && <Tab>{t('groupDivision')}</Tab>}
                {category.hasGroupStage ? (
                  <Tab>{t('groupStage')}</Tab>
                ) : (
                  <Tab>{t('matches')}</Tab>
                )}
              </TabList>

              <TabPanels>
                {/* Settings Tab */}
                <TabPanel>
                  <Card>
                    <CardBody>
                      <VStack align="stretch" gap={4}>
                        <Heading size="md">{t('categorySettings')}</Heading>

                        <Box>
                          <HStack gap={2}>
                            <input
                              type="checkbox"
                              checked={formData.hasGroupStage}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                setFormData({
                                  ...formData,
                                  hasGroupStage: e.target.checked,
                                })
                              }
                            />
                            <Text>{t('hasGroupStage')}</Text>
                          </HStack>
                        </Box>

                        <Field.Root>
                          <Field.Label>{t('averageMatchDuration')}</Field.Label>
                          <Input
                            type="number"
                            value={formData.averageMatchDuration}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) =>
                              setFormData({
                                ...formData,
                                averageMatchDuration:
                                  parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder={t('averageMatchDurationPlaceholder')}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>{t('matchFormat')}</Field.Label>
                          <select
                            value={formData.matchFormat}
                            onChange={(
                              e: React.ChangeEvent<HTMLSelectElement>
                            ) =>
                              setFormData({
                                ...formData,
                                matchFormat: e.target.value as MatchFormat,
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            <option value={MatchFormat.BEST_OF_1}>
                              {t('bestOf1Set')}
                            </option>
                            <option value={MatchFormat.BEST_OF_3}>
                              {t('bestOf3Sets')}
                            </option>
                          </select>
                        </Field.Root>

                        {formData.hasGroupStage && (
                          <>
                            <Field.Root>
                              <Field.Label>{t('groupCount')}</Field.Label>
                              <Input
                                type="number"
                                value={formData.groupCount}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  setFormData({
                                    ...formData,
                                    groupCount: parseInt(e.target.value) || 0,
                                  })
                                }
                                placeholder={t('groupCountPlaceholder')}
                              />
                            </Field.Root>

                            <Field.Root>
                              <Field.Label>{t('winnersPerGroup')}</Field.Label>
                              <Input
                                type="number"
                                value={formData.winnersPerGroup}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) =>
                                  setFormData({
                                    ...formData,
                                    winnersPerGroup:
                                      parseInt(e.target.value) || 0,
                                  })
                                }
                                placeholder={t('winnersPerGroupPlaceholder')}
                              />
                            </Field.Root>
                          </>
                        )}

                        {formData.hasGroupStage &&
                          registrations.length > 0 &&
                          formData.groupCount > 0 && (
                            <Box
                              p={3}
                              bg="blue.50"
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor="blue.200"
                            >
                              <Text fontSize="sm" color="green.700">
                                {t('totalTeams')}: {registrations.length} |{' '}
                                {t('groups')}: {formData.groupCount} |{' '}
                                {t('averageTeamsPerGroup', {
                                  count: Math.ceil(
                                    registrations.length / formData.groupCount
                                  ),
                                })}
                              </Text>
                            </Box>
                          )}

                        <Button
                          leftIcon={<Save size={16} />}
                          onClick={handleSaveSettings}
                          loading={saving}
                          colorPalette="green"
                        >
                          {t('saveSettings')}
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Registrations Tab */}
                <TabPanel>
                  <Card>
                    <CardBody>
                      <VStack align="stretch" gap={4}>
                        <Flex justify="space-between" alignItems="center">
                          <Heading size="md">{t('playerRegistration')}</Heading>
                          <Button
                            leftIcon={<Plus size={16} />}
                            onClick={onRegistrationOpen}
                            size="sm"
                          >
                            {isSingle ? t('addPlayer') : t('addPair')}
                          </Button>
                        </Flex>

                        {registrations.length === 0 ? (
                          <Text color="gray.500">
                            {isSingle
                              ? t('noPlayersRegisteredYet')
                              : t('noPairsRegisteredYet')}
                          </Text>
                        ) : (
                          <SimpleGrid
                            columns={{ base: 1, md: 2, lg: 3 }}
                            spacing={4}
                          >
                            {registrations.map((registration) => (
                              <Card key={registration.id} variant="outline">
                                <CardBody>
                                  <Flex
                                    justify="space-between"
                                    alignItems="start"
                                  >
                                    <VStack align="start" gap={1}>
                                      {registration.player ? (
                                        <>
                                          <Heading size="sm">
                                            {registration.player.name}
                                          </Heading>
                                          {registration.player.level && (
                                            <Badge>
                                              {registration.player.level}
                                            </Badge>
                                          )}
                                        </>
                                      ) : registration.pair ? (
                                        <>
                                          <Heading size="sm">
                                            {registration.pair.name ||
                                              t('pair') +
                                                ' ' +
                                                registration.pair.id.slice(
                                                  0,
                                                  8
                                                )}
                                          </Heading>
                                          {registration.pair.members && (
                                            <Text
                                              fontSize="sm"
                                              color="gray.600"
                                            >
                                              {registration.pair.members
                                                .map(
                                                  (m) =>
                                                    m.player?.name ||
                                                    t('unknown')
                                                )
                                                .join(' & ')}
                                            </Text>
                                          )}
                                        </>
                                      ) : (
                                        <Text>{t('unknown')}</Text>
                                      )}
                                    </VStack>
                                    <IconButton
                                      aria-label={t('removeRegistration')}
                                      icon={<X size={16} />}
                                      size="sm"
                                      variant="ghost"
                                      colorPalette="red"
                                      onClick={() =>
                                        handleRemoveRegistration(
                                          registration.id
                                        )
                                      }
                                    />
                                  </Flex>
                                </CardBody>
                              </Card>
                            ))}
                          </SimpleGrid>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Group Division Tab */}
                {category.hasGroupStage && (
                  <TabPanel>
                    <GroupDivisionTab
                      category={category}
                      registrations={registrations}
                      groups={groups}
                      onGroupsChange={loadGroups}
                      onRegistrationsChange={loadRegistrations}
                      t={t}
                    />
                  </TabPanel>
                )}

                {/* Matches Tab / Group Stage Tab */}
                <TabPanel>
                  {category.hasGroupStage ? (
                    <GroupStageTab
                      category={category}
                      groups={groups}
                      matches={matches}
                      tournamentId={tournamentId}
                      categoryId={categoryId}
                      onMatchesChange={loadMatches}
                      onGroupsChange={loadGroups}
                      t={t}
                    />
                  ) : (
                    <Card>
                      <CardBody>
                        <VStack align="stretch" gap={4}>
                          <Flex justify="space-between" alignItems="center">
                            <Heading size="md">{t('matches')}</Heading>
                            <Button
                              leftIcon={<Plus size={16} />}
                              onClick={handleCreateMatch}
                              size="sm"
                            >
                              {t('createMatch')}
                            </Button>
                          </Flex>

                          {matches.length === 0 ? (
                            <Text color="gray.500">{t('noMatchesYet')}</Text>
                          ) : (
                            <TableContainer>
                              <Table variant="simple" size="sm">
                                <Thead>
                                  <Tr>
                                    <Th>{t('matchNumber')}</Th>
                                    <Th>{t('roundLabel')}</Th>
                                    <Th>{t('participantsLabel')}</Th>
                                    <Th>{t('matchFormat')}</Th>
                                    <Th>{t('scoreLabel')}</Th>
                                    <Th>{t('statusLabel')}</Th>
                                    <Th>{t('actions')}</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {matches.map((match) => (
                                    <Tr key={match.id}>
                                      <Td>#{match.matchNumber}</Td>
                                      <Td>{match.round}</Td>
                                      <Td>
                                        {match.participants
                                          ?.map((p) => {
                                            if (
                                              p.categoryRegistration?.player
                                            ) {
                                              return p.categoryRegistration
                                                .player.name;
                                            }
                                            if (p.categoryRegistration?.pair) {
                                              return (
                                                p.categoryRegistration.pair
                                                  .name || t('pair')
                                              );
                                            }
                                            return t('unknown');
                                          })
                                          .join(' vs ')}
                                      </Td>
                                      <Td>
                                        {match.matchFormat ===
                                        MatchFormat.BEST_OF_1
                                          ? t('bestOf1Set')
                                          : match.matchFormat ===
                                              MatchFormat.BEST_OF_3
                                            ? t('bestOf3Sets')
                                            : category?.matchFormat ===
                                                MatchFormat.BEST_OF_1
                                              ? t('bestOf1Set')
                                              : t('bestOf3Sets')}
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
                                        <HStack>
                                          {match.status === 'SCHEDULED' && (
                                            <IconButton
                                              aria-label={t('startMatch')}
                                              icon={<Play size={14} />}
                                              size="xs"
                                              onClick={async () => {
                                                try {
                                                  await CategoryService.startMatch(
                                                    match.id
                                                  );
                                                  loadMatches();
                                                } catch (error) {
                                                  console.error(
                                                    'Error starting match:',
                                                    error
                                                  );
                                                }
                                              }}
                                            />
                                          )}
                                          {match.status === 'IN_PROGRESS' && (
                                            <NextLinkButton
                                              href={`/host/tournaments/${tournamentId}/categories/${categoryId}/matches/${match.id}`}
                                              size="xs"
                                            >
                                              {t('endMatch')}
                                            </NextLinkButton>
                                          )}
                                        </HStack>
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>

        {/* Add Registration Modal */}
        {isRegistrationOpen && (
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="blackAlpha.600"
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={handleRegistrationClose}
          >
            <Box
              bg="white"
              borderRadius="md"
              maxW="800px"
              w="90%"
              maxH="90vh"
              overflowY="auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
                <Heading size="md">
                  {isSingle ? t('addPlayerToCategory') : t('addPairToCategory')}
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  {isSingle
                    ? t('selectPlayerFromList')
                    : t('selectPairFromList')}
                </Text>
              </Box>
              <Box p={4}>
                {availableItems.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={8}>
                    {isSingle ? t('noAvailablePlayers') : t('noAvailablePairs')}
                  </Text>
                ) : (
                  <SimpleGrid
                    columns={{ base: 1, md: 2, lg: 3 }}
                    spacing={4}
                    maxH="60vh"
                    overflowY="auto"
                  >
                    {availableItems.map((item) => {
                      const isSelected = selectedRegistration === item.id;
                      const player = isSingle
                        ? (item as TournamentPlayer)
                        : null;
                      const pair = !isSingle ? (item as TournamentPair) : null;

                      return (
                        <Card
                          key={item.id}
                          variant="outline"
                          cursor="pointer"
                          borderWidth="2px"
                          borderColor={isSelected ? 'blue.500' : 'gray.200'}
                          bg={isSelected ? 'blue.50' : 'white'}
                          onClick={() => {
                            setSelectedRegistration(
                              isSelected ? null : item.id
                            );
                          }}
                          _hover={{
                            borderColor: 'blue.300',
                            transform: 'scale(1.02)',
                            boxShadow: 'md',
                          }}
                          transition="all 0.2s"
                        >
                          <CardBody p={4}>
                            <VStack align="start" gap={2}>
                              {isSingle && player ? (
                                <>
                                  <Heading size="sm">{player.name}</Heading>
                                  {player.level && (
                                    <Badge colorPalette="green">
                                      {player.level}
                                    </Badge>
                                  )}
                                  {player.gender && (
                                    <Text fontSize="xs" color="gray.600">
                                      {player.gender}
                                    </Text>
                                  )}
                                </>
                              ) : pair ? (
                                <>
                                  <Heading size="sm">
                                    {pair.name ||
                                      `${t('pair')} ${pair.id.slice(0, 8)}`}
                                  </Heading>
                                  {pair.members && pair.members.length > 0 && (
                                    <VStack align="start" gap={1} w="100%">
                                      {pair.members.map((member, idx) => (
                                        <HStack key={idx} gap={2}>
                                          <Text fontSize="sm" color="gray.700">
                                            {member.player?.name ||
                                              t('unknown')}
                                          </Text>
                                          {member.player?.level && (
                                            <Badge
                                              fontSize="xs"
                                              colorPalette="gray"
                                            >
                                              {member.player.level}
                                            </Badge>
                                          )}
                                        </HStack>
                                      ))}
                                    </VStack>
                                  )}
                                </>
                              ) : (
                                <Text>{t('unknown')}</Text>
                              )}
                              {isSelected && (
                                <Badge colorPalette="green" mt={1}>
                                  {t('selected')}
                                </Badge>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                )}
              </Box>
              <Flex
                justify="flex-end"
                gap={3}
                p={4}
                borderTopWidth="1px"
                borderColor="gray.200"
              >
                <Button variant="ghost" onClick={handleRegistrationClose}>
                  {t('cancel')}
                </Button>
                <Button
                  colorPalette="green"
                  onClick={handleAddRegistration}
                  disabled={!selectedRegistration}
                >
                  {t('add')}
                </Button>
              </Flex>
            </Box>
          </Box>
        )}

        {/* Create Match Modal */}
        {isMatchOpen && (
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="blackAlpha.600"
            zIndex={1000}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={onMatchClose}
          >
            <Box
              bg="white"
              borderRadius="md"
              maxW="600px"
              w="90%"
              maxH="90vh"
              overflowY="auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
                <Heading size="md">{t('createMatchTitle')}</Heading>
              </Box>
              <Box p={4}>
                <VStack gap={4}>
                  <Field.Root required>
                    <Field.Label>{t('round')}</Field.Label>
                    <Input
                      value={matchFormData.round}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMatchFormData({
                          ...matchFormData,
                          round: e.target.value,
                        })
                      }
                      placeholder={t('roundPlaceholder')}
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>{t('matchNumberLabel')}</Field.Label>
                    <Input
                      type="number"
                      value={matchFormData.matchNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMatchFormData({
                          ...matchFormData,
                          matchNumber: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>{t('participant1')}</Field.Label>
                    <select
                      value={matchFormData.participant1Id}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setMatchFormData({
                          ...matchFormData,
                          participant1Id: e.target.value,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <option value="">{t('selectParticipant1')}</option>
                      {registrations.map((reg) => {
                        const name = reg.player
                          ? reg.player.name
                          : reg.pair
                            ? reg.pair.name || t('pair')
                            : t('unknown');
                        return (
                          <option
                            key={reg.id}
                            value={reg.player?.id || reg.pair?.id || ''}
                          >
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </Field.Root>

                  <Field.Root required>
                    <Field.Label>{t('participant2')}</Field.Label>
                    <select
                      value={matchFormData.participant2Id}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setMatchFormData({
                          ...matchFormData,
                          participant2Id: e.target.value,
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <option value="">{t('selectParticipant2')}</option>
                      {registrations
                        .filter(
                          (reg) =>
                            (reg.player?.id || reg.pair?.id) !==
                            matchFormData.participant1Id
                        )
                        .map((reg) => {
                          const name = reg.player
                            ? reg.player.name
                            : reg.pair
                              ? reg.pair.name || t('pair')
                              : t('unknown');
                          return (
                            <option
                              key={reg.id}
                              value={reg.player?.id || reg.pair?.id || ''}
                            >
                              {name}
                            </option>
                          );
                        })}
                    </select>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{t('matchFormat')}</Field.Label>
                    <select
                      value={matchFormData.matchFormat}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setMatchFormData({
                          ...matchFormData,
                          matchFormat: e.target.value as MatchFormat,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <option value={MatchFormat.BEST_OF_1}>
                        {t('bestOf1Set')}
                      </option>
                      <option value={MatchFormat.BEST_OF_3}>
                        {t('bestOf3Sets')}
                      </option>
                    </select>
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>{t('startTimeOptional')}</Field.Label>
                    <Input
                      type="datetime-local"
                      value={matchFormData.startTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMatchFormData({
                          ...matchFormData,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </Field.Root>
                </VStack>
              </Box>
              <Flex
                justify="flex-end"
                gap={3}
                p={4}
                borderTopWidth="1px"
                borderColor="gray.200"
              >
                <Button variant="ghost" onClick={onMatchClose}>
                  {t('cancel')}
                </Button>
                <Button colorPalette="green" onClick={handleSaveMatch}>
                  {t('createMatch')}
                </Button>
              </Flex>
            </Box>
          </Box>
        )}
      </Box>
    </ProtectedRouteGuard>
  );
}

// Group Division Tab Component
function GroupDivisionTab({
  category,
  registrations,
  groups,
  onGroupsChange,
  onRegistrationsChange,
  t,
}: {
  category: Category;
  registrations: CategoryRegistration[];
  groups: CategoryGroup[];
  onGroupsChange: () => void;
  onRegistrationsChange: () => void;
  t: (key: string) => string;
}) {
  const categoryId = category.id;
  const [loading, setLoading] = useState(false);
  const [selectedGroupForTeam, setSelectedGroupForTeam] = useState<
    string | null
  >(null);
  const [selectedRegistration, setSelectedRegistration] = useState<
    string | null
  >(null);
  const {
    open: isAddTeamOpen,
    onOpen: onAddTeamOpen,
    onClose: onAddTeamClose,
  } = useDisclosure();

  // Get assigned registration IDs
  const assignedRegistrationIds = new Set(
    groups.flatMap(
      (group) =>
        group.registrations?.map((gr) => gr.categoryRegistrationId) || []
    )
  );

  // Get unassigned registrations
  const unassignedRegistrations = registrations.filter(
    (reg) => !assignedRegistrationIds.has(reg.id)
  );

  const handleCreateGroups = async () => {
    if (!category.groupCount || category.groupCount < 1) {
      alert('Vui lòng chỉ định số lượng bảng trong Settings');
      return;
    }
    try {
      setLoading(true);
      await CategoryService.createGroups(categoryId);
      onGroupsChange();
    } catch (error) {
      console.error('Error creating groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (unassignedRegistrations.length === 0) {
      alert('Không còn đội nào để phân bảng');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn tự động phân bảng tất cả các đội?')) {
      return;
    }
    try {
      setLoading(true);
      await CategoryService.autoAssignAllRegistrations(categoryId, {
        shuffle: true,
      });
      onGroupsChange();
      onRegistrationsChange();
    } catch (error) {
      console.error('Error auto-assigning:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamToGroup = (groupId: string) => {
    setSelectedGroupForTeam(groupId);
    onAddTeamOpen();
  };

  const handleAssignTeam = async () => {
    if (!selectedRegistration || !selectedGroupForTeam) return;
    try {
      setLoading(true);
      await CategoryService.assignRegistrationToGroup(
        categoryId,
        selectedGroupForTeam,
        selectedRegistration
      );
      onAddTeamClose();
      setSelectedRegistration(null);
      setSelectedGroupForTeam(null);
      onGroupsChange();
      onRegistrationsChange();
    } catch (error) {
      console.error('Error assigning team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeam = async (groupId: string, registrationId: string) => {
    if (!confirm('Xóa đội này khỏi bảng?')) return;
    try {
      setLoading(true);
      await CategoryService.removeRegistrationFromGroup(
        categoryId,
        groupId,
        registrationId
      );
      onGroupsChange();
      onRegistrationsChange();
    } catch (error) {
      console.error('Error removing team:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSingle =
    category.type === CategoryType.MENS_SINGLE ||
    category.type === CategoryType.WOMENS_SINGLE;

  return (
    <VStack align="stretch" gap={4}>
      {/* Info and Actions */}
      <Card>
        <CardBody>
          <VStack align="stretch" gap={4}>
            <Flex
              justify="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={4}
            >
              <VStack align="start" gap={1}>
                <Heading size="md">{t('groupDivision')}</Heading>
                {registrations.length > 0 &&
                  category.groupCount &&
                  category.groupCount > 0 && (
                    <Text fontSize="sm" color="gray.600">
                      {t('totalTeams')}: {registrations.length} | {t('groups')}:{' '}
                      {category.groupCount} | Trung bình ~
                      {Math.ceil(registrations.length / category.groupCount)}{' '}
                      đội mỗi bảng
                    </Text>
                  )}
              </VStack>
              <HStack gap={2}>
                {groups.length === 0 && (
                  <Button
                    leftIcon={<Users size={16} />}
                    onClick={handleCreateGroups}
                    loading={loading}
                    colorPalette="green"
                  >
                    {t('createGroups')}
                  </Button>
                )}
                {groups.length > 0 && unassignedRegistrations.length > 0 && (
                  <Button
                    leftIcon={<Users size={16} />}
                    onClick={handleAutoAssign}
                    loading={loading}
                    colorPalette="pink"
                  >
                    {t('autoAssignTeams')}
                  </Button>
                )}
              </HStack>
            </Flex>
          </VStack>
        </CardBody>
      </Card>

      {/* Available Teams */}
      {unassignedRegistrations.length > 0 && (
        <Card>
          <CardBody>
            <VStack align="stretch" gap={4}>
              <Heading size="sm">{t('availableTeams')}</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {unassignedRegistrations.map((registration) => (
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
                              {registration.pair.name || t('pair')}
                            </Heading>
                            {registration.pair.members && (
                              <Text fontSize="sm" color="gray.600">
                                {registration.pair.members
                                  .map((m) => m.player?.name || t('unknown'))
                                  .join(' & ')}
                              </Text>
                            )}
                          </>
                        ) : (
                          <Text>{t('unknown')}</Text>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Groups */}
      {groups.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="gray.500" textAlign="center" py={8}>
              {t('noGroupsYet')}
            </Text>
          </CardBody>
        </Card>
      ) : (
        <VStack align="stretch" gap={4}>
          {groups.map((group) => {
            const groupRegistrations =
              group.registrations?.map((gr) => gr.categoryRegistration) || [];
            return (
              <Card key={group.id}>
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Flex justify="space-between" alignItems="center">
                      <Heading size="md">
                        {group.name || `Group ${group.groupNumber}`} (
                        {(t as any)('teamsInGroup', {
                          count: groupRegistrations.length,
                        })}
                        )
                      </Heading>
                      <Button
                        leftIcon={<Plus size={16} />}
                        onClick={() => handleAddTeamToGroup(group.id)}
                        size="sm"
                      >
                        {t('addTeam')}
                      </Button>
                    </Flex>

                    {groupRegistrations.length === 0 ? (
                      <Text color="gray.500">{t('noTeamsInGroup')}</Text>
                    ) : (
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>{isSingle ? 'Tên' : 'Tên đội'}</Th>
                              <Th>
                                {isSingle ? 'Người chơi' : 'Người chơi 1'}
                              </Th>
                              {!isSingle && <Th>Người chơi 2</Th>}
                              <Th>{t('actions')}</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {groupRegistrations
                              .filter((r): r is CategoryRegistration => !!r)
                              .map((registration) => (
                                <Tr key={registration.id}>
                                  <Td>
                                    {registration.player
                                      ? registration.player.name
                                      : registration.pair
                                        ? registration.pair.name || t('pair')
                                        : t('unknown')}
                                  </Td>
                                  <Td>
                                    {registration.player
                                      ? registration.player.name
                                      : registration.pair?.members?.[0]?.player
                                          ?.name || t('unknown')}
                                  </Td>
                                  {!isSingle && (
                                    <Td>
                                      {registration.pair?.members?.[1]?.player
                                        ?.name || t('unknown')}
                                    </Td>
                                  )}
                                  <Td>
                                    <IconButton
                                      aria-label={t('removeFromGroup')}
                                      icon={<X size={14} />}
                                      size="xs"
                                      variant="ghost"
                                      colorPalette="red"
                                      onClick={() =>
                                        handleRemoveTeam(
                                          group.id,
                                          registration.id
                                        )
                                      }
                                    />
                                  </Td>
                                </Tr>
                              ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}

      {/* Add Team Modal */}
      {isAddTeamOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={onAddTeamClose}
        >
          <Box
            bg="white"
            borderRadius="md"
            maxW="600px"
            w="90%"
            maxH="90vh"
            overflowY="auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
              <Heading size="md">{t('addTeam')}</Heading>
            </Box>
            <Box p={4}>
              {unassignedRegistrations.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  {t('noAvailablePlayers')}
                </Text>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {unassignedRegistrations.map((registration) => {
                    const isSelected = selectedRegistration === registration.id;
                    return (
                      <Card
                        key={registration.id}
                        variant="outline"
                        cursor="pointer"
                        borderWidth="2px"
                        borderColor={isSelected ? 'blue.500' : 'gray.200'}
                        bg={isSelected ? 'blue.50' : 'white'}
                        onClick={() =>
                          setSelectedRegistration(
                            isSelected ? null : registration.id
                          )
                        }
                        _hover={{
                          borderColor: 'blue.300',
                        }}
                      >
                        <CardBody p={4}>
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
                                  {registration.pair.name || t('pair')}
                                </Heading>
                                {registration.pair.members && (
                                  <Text fontSize="sm" color="gray.600">
                                    {registration.pair.members
                                      .map(
                                        (m) => m.player?.name || t('unknown')
                                      )
                                      .join(' & ')}
                                  </Text>
                                )}
                              </>
                            ) : (
                              <Text>{t('unknown')}</Text>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              )}
            </Box>
            <Flex
              justify="flex-end"
              gap={3}
              p={4}
              borderTopWidth="1px"
              borderColor="gray.200"
            >
              <Button variant="ghost" onClick={onAddTeamClose}>
                {t('cancel')}
              </Button>
              <Button
                colorPalette="green"
                onClick={handleAssignTeam}
                disabled={!selectedRegistration}
                loading={loading}
              >
                {t('add')}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </VStack>
  );
}

// Group Stage Tab Component
function GroupStageTab({
  category,
  groups,
  matches,
  tournamentId,
  categoryId,
  onMatchesChange,
  onGroupsChange,
  t,
}: {
  category: Category;
  groups: CategoryGroup[];
  matches: CategoryMatch[];
  tournamentId: string;
  categoryId: string;
  onMatchesChange: () => void;
  onGroupsChange: () => void;
  t: (key: string) => string;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<CategoryMatch | null>(
    null
  );
  const [matchConfigOpen, setMatchConfigOpen] = useState(false);
  const [matchScoresOpen, setMatchScoresOpen] = useState(false);
  const [groupMatches, setGroupMatches] = useState<
    Record<string, CategoryMatch[]>
  >({});

  useEffect(() => {
    loadGroupMatches();
  }, [groups, matches]);

  const loadGroupMatches = async () => {
    const matchesByGroup: Record<string, CategoryMatch[]> = {};
    for (const group of groups) {
      try {
        const groupMatchesData = await CategoryService.getGroupMatches(
          categoryId,
          group.id
        );
        matchesByGroup[group.id] = groupMatchesData;
      } catch (error) {
        console.error(`Error loading matches for group ${group.id}:`, error);
        matchesByGroup[group.id] = [];
      }
    }
    setGroupMatches(matchesByGroup);
  };

  const handleGenerateAllMatches = async () => {
    if (!confirm('Tạo tất cả trận đấu cho tất cả các bảng?')) return;
    try {
      setLoading(true);
      for (const group of groups) {
        try {
          await CategoryService.generateGroupMatches(categoryId, group.id);
        } catch (error) {
          console.error(
            `Error generating matches for group ${group.id}:`,
            error
          );
        }
      }
      await loadGroupMatches();
      onMatchesChange();
    } catch (error) {
      console.error('Error generating matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGroupStage = async () => {
    // Check if all matches are finished
    const allMatches = Object.values(groupMatches).flat();
    const unfinishedMatches = allMatches.filter((m) => m.status !== 'FINISHED');

    if (unfinishedMatches.length > 0) {
      alert(
        `Không thể hoàn thành vòng bảng. Còn ${unfinishedMatches.length} trận đấu chưa hoàn thành.`
      );
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn hoàn thành vòng bảng?')) return;

    try {
      setLoading(true);
      await CategoryService.completeGroupStage(categoryId);
      onMatchesChange();
      onGroupsChange();
    } catch (error) {
      console.error('Error completing group stage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureMatch = (match: CategoryMatch) => {
    setSelectedMatch(match);
    setMatchConfigOpen(true);
  };

  const handleSetScores = (match: CategoryMatch) => {
    setSelectedMatch(match);
    setMatchScoresOpen(true);
  };

  const allMatches = Object.values(groupMatches).flat();
  const allFinished =
    allMatches.length > 0 && allMatches.every((m) => m.status === 'FINISHED');
  const hasMatches = allMatches.length > 0;

  return (
    <VStack align="stretch" gap={4}>
      {/* Actions */}
      <Card>
        <CardBody>
          <Flex
            justify="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={4}
          >
            <Heading size="md">{t('groupStage')}</Heading>
            <HStack gap={2}>
              {!hasMatches && (
                <Button
                  leftIcon={<Play size={16} />}
                  onClick={handleGenerateAllMatches}
                  loading={loading}
                  colorPalette="green"
                >
                  {t('generateAllMatches')}
                </Button>
              )}
              {allFinished && hasMatches && (
                <Button
                  leftIcon={<Trophy size={16} />}
                  onClick={handleCompleteGroupStage}
                  loading={loading}
                  colorPalette="pink"
                >
                  {t('completeGroupStage')}
                </Button>
              )}
            </HStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Groups */}
      {groups.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="gray.500" textAlign="center" py={8}>
              {t('noGroupsYet')}
            </Text>
          </CardBody>
        </Card>
      ) : (
        <VStack align="stretch" gap={6}>
          {groups.map((group) => {
            const groupMatchesList = groupMatches[group.id] || [];
            return (
              <Card key={group.id}>
                <CardBody>
                  <VStack align="stretch" gap={4}>
                    <Heading size="lg">
                      {group.name || `Group ${group.groupNumber}`}
                    </Heading>

                    {groupMatchesList.length === 0 ? (
                      <Text color="gray.500">{t('noMatchesYet')}</Text>
                    ) : (
                      <SimpleGrid
                        columns={{ base: 1, md: 2, lg: 3 }}
                        spacing={4}
                      >
                        {groupMatchesList.map((match) => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            onConfigure={() => handleConfigureMatch(match)}
                            onSetScores={() => handleSetScores(match)}
                            t={t}
                          />
                        ))}
                      </SimpleGrid>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      )}

      {/* Match Configuration Modal */}
      {matchConfigOpen && selectedMatch && (
        <MatchConfigurationModal
          match={selectedMatch}
          tournamentId={tournamentId}
          categoryId={categoryId}
          isOpen={matchConfigOpen}
          onClose={() => {
            setMatchConfigOpen(false);
            setSelectedMatch(null);
          }}
          onSave={async () => {
            await loadGroupMatches();
            onMatchesChange();
            setMatchConfigOpen(false);
            setSelectedMatch(null);
          }}
          t={t}
        />
      )}

      {/* Match Scores Modal */}
      {matchScoresOpen && selectedMatch && (
        <MatchScoresModal
          match={selectedMatch}
          categoryId={categoryId}
          isOpen={matchScoresOpen}
          onClose={() => {
            setMatchScoresOpen(false);
            setSelectedMatch(null);
          }}
          onSave={async () => {
            await loadGroupMatches();
            onMatchesChange();
            setMatchScoresOpen(false);
            setSelectedMatch(null);
          }}
          t={t}
        />
      )}
    </VStack>
  );
}

// Match Card Component
function MatchCard({
  match,
  onConfigure,
  onSetScores,
  t,
}: {
  match: CategoryMatch;
  onConfigure: () => void;
  onSetScores: () => void;
  t: (key: string) => string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    bottom: 0,
    right: 0,
    placement: 'top' as 'top' | 'bottom',
  });

  // Calculate menu position when opening
  useEffect(() => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 100; // Estimated menu height
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Choose placement based on available space
      const placement = spaceAbove > menuHeight ? 'top' : 'bottom';

      setMenuPosition({
        top: placement === 'top' ? rect.top - 4 : rect.bottom + 4,
        bottom:
          placement === 'bottom' ? window.innerHeight - rect.bottom - 4 : 0,
        right: window.innerWidth - rect.right,
        placement,
      });
    }
  }, [menuOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);
  const participants = match.participants || [];
  const participant1 = participants[0]?.categoryRegistration;
  const participant2 = participants[1]?.categoryRegistration;

  const getTeamName = (reg?: CategoryRegistration) => {
    if (!reg) return t('unknown');
    if (reg.player) return reg.player.name;
    if (reg.pair) return reg.pair.name || t('pair');
    return t('unknown');
  };

  const getStatusColor = (status: MatchStatus) => {
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

  return (
    <Card variant="outline" position="relative">
      <CardBody>
        <VStack align="stretch" gap={3}>
          {/* Header */}
          <Flex justify="space-between" alignItems="start">
            <VStack align="start" gap={1} flex={1}>
              <Text fontSize="sm" fontWeight="bold">
                {getTeamName(participant1)} {t('vs')}{' '}
                {getTeamName(participant2)}
              </Text>
              <Badge colorPalette={getStatusColor(match.status)} size="sm">
                {match.status}
              </Badge>
            </VStack>
            <Box position="relative">
              <Box ref={buttonRef} as="span" display="inline-block">
                <IconButton
                  aria-label={t('configureMatch')}
                  icon={<Settings size={14} />}
                  size="xs"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                />
              </Box>
              {menuOpen &&
                typeof window !== 'undefined' &&
                createPortal(
                  <Box
                    ref={menuRef}
                    position="fixed"
                    top={
                      menuPosition.placement === 'top'
                        ? `${menuPosition.top}px`
                        : undefined
                    }
                    bottom={
                      menuPosition.placement === 'bottom'
                        ? `${menuPosition.bottom}px`
                        : undefined
                    }
                    right={`${menuPosition.right}px`}
                    transform={
                      menuPosition.placement === 'top'
                        ? 'translateY(-100%)'
                        : 'none'
                    }
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="xl"
                    zIndex={9999}
                    minW="160px"
                    maxW="200px"
                  >
                    <VStack align="stretch" p={1} gap={0}>
                      <Button
                        size="sm"
                        variant="ghost"
                        justifyContent="flex-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfigure();
                          setMenuOpen(false);
                        }}
                        _hover={{ bg: 'gray.100' }}
                      >
                        {t('configureMatch')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        justifyContent="flex-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetScores();
                          setMenuOpen(false);
                        }}
                        _hover={{ bg: 'gray.100' }}
                      >
                        {match.status === 'FINISHED'
                          ? t('updateScores') || t('setScores')
                          : t('setScores')}
                      </Button>
                    </VStack>
                  </Box>,
                  document.body
                )}
            </Box>
          </Flex>

          {/* Match Info */}
          <VStack align="start" gap={1} fontSize="xs" color="gray.600">
            {match.court && (
              <Text>
                {t('court')}:{' '}
                {match.court.courtName || `Court ${match.court.courtNumber}`}
              </Text>
            )}
            {match.startTime && (
              <Text>
                {t('dateTime')}:{' '}
                {format(new Date(match.startTime), 'MMM dd, yyyy - hh:mm a')}
              </Text>
            )}
          </VStack>

          {/* Scores */}
          {match.score && (
            <Box p={2} bg="pink.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="bold">
                {t('scoreLabel')}: {match.score}
              </Text>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

// Match Configuration Modal
function MatchConfigurationModal({
  match,
  tournamentId,
  categoryId,
  isOpen,
  onClose,
  onSave,
  t,
}: {
  match: CategoryMatch;
  tournamentId: string;
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  t: (key: string) => string;
}) {
  const [loading, setLoading] = useState(false);
  const [umpires, setUmpires] = useState<TournamentUmpire[]>([]);
  const [courts, setCourts] = useState<TournamentCourt[]>([]);
  const [scoringDevices, setScoringDevices] = useState<
    TournamentScoringDevice[]
  >([]);
  const [formData, setFormData] = useState({
    umpireId: '',
    scoringDeviceId: '',
    courtId: match.courtId || '',
    startTime: match.startTime
      ? format(new Date(match.startTime), "yyyy-MM-dd'T'HH:mm")
      : '',
    numberOfGames:
      match.sets?.length ||
      (match.matchFormat === MatchFormat.BEST_OF_1 ? 1 : 3),
  });

  useEffect(() => {
    if (isOpen) {
      loadTournamentData();
      // Update formData when match changes
      setFormData({
        umpireId: '',
        scoringDeviceId: '',
        courtId: match.courtId || '',
        startTime: match.startTime
          ? format(new Date(match.startTime), "yyyy-MM-dd'T'HH:mm")
          : '',
        numberOfGames:
          match.sets?.length ||
          (match.matchFormat === MatchFormat.BEST_OF_1 ? 1 : 3),
      });
    }
  }, [isOpen, tournamentId, match]);

  const loadTournamentData = async () => {
    try {
      // Load umpires, courts, scoring devices
      const [umpiresRes, courtsRes, devicesRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/umpires`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/courts`).then((r) => r.json()),
        fetch(`/api/tournaments/${tournamentId}/scoring-devices`).then((r) =>
          r.json()
        ),
      ]);

      if (umpiresRes.success) setUmpires(umpiresRes.data || []);
      if (courtsRes.success) setCourts(courtsRes.data || []);
      if (devicesRes.success) setScoringDevices(devicesRes.data || []);
    } catch (error) {
      console.error('Error loading tournament data:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updateData: any = {};
      if (formData.courtId) updateData.courtId = formData.courtId;
      if (formData.startTime) {
        updateData.startTime = new Date(formData.startTime);
      }
      // Update matchFormat based on numberOfGames
      if (formData.numberOfGames === 1) {
        updateData.matchFormat = MatchFormat.BEST_OF_1;
      } else if (formData.numberOfGames === 3) {
        updateData.matchFormat = MatchFormat.BEST_OF_3;
      }
      // Note: umpireId and scoringDeviceId might need to be stored differently
      // depending on your schema - this is a placeholder
      await CategoryService.updateMatch(match.id, updateData);
      onSave();
    } catch (error) {
      console.error('Error updating match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.600"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="md"
        maxW="600px"
        w="90%"
        maxH="90vh"
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
          <Heading size="md">{t('matchDetails')}</Heading>
        </Box>
        <Box p={4}>
          <VStack gap={4}>
            <Field.Root>
              <Field.Label>{t('umpire')}</Field.Label>
              <select
                value={formData.umpireId}
                onChange={(e) =>
                  setFormData({ ...formData, umpireId: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="">
                  {t('select')} {t('umpire')}
                </option>
                {umpires.map((umpire) => (
                  <option key={umpire.id} value={umpire.id}>
                    {umpire.name}
                  </option>
                ))}
              </select>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('scoringDevice')}</Field.Label>
              <select
                value={formData.scoringDeviceId}
                onChange={(e) =>
                  setFormData({ ...formData, scoringDeviceId: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="">
                  {t('select')} {t('scoringDevice')}
                </option>
                {scoringDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('court')}</Field.Label>
              <select
                value={formData.courtId}
                onChange={(e) =>
                  setFormData({ ...formData, courtId: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value="">
                  {t('select')} {t('court')}
                </option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.courtName || `Court ${court.courtNumber}`}
                  </option>
                ))}
              </select>
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('dateTime')}</Field.Label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>{t('numberOfGames')}</Field.Label>
              <select
                value={formData.numberOfGames}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numberOfGames: parseInt(e.target.value),
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <option value={1}>{t('bestOf1')}</option>
                <option value={3}>{t('bestOf3')}</option>
              </select>
            </Field.Root>
          </VStack>
        </Box>
        <Flex
          justify="flex-end"
          gap={3}
          p={4}
          borderTopWidth="1px"
          borderColor="gray.200"
        >
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button colorPalette="green" onClick={handleSave} loading={loading}>
            {t('save')}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}

// Match Scores Modal
function MatchScoresModal({
  match,
  categoryId,
  isOpen,
  onClose,
  onSave,
  t,
}: {
  match: CategoryMatch;
  categoryId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  t: (key: string) => string;
}) {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Array<{ team1: number; team2: number }>>(
    [
      { team1: 0, team2: 0 },
      { team1: 0, team2: 0 },
      { team1: 0, team2: 0 },
    ]
  );
  // Determine numberOfGames from matchFormat or existing sets
  const numberOfGames =
    match.matchFormat === MatchFormat.BEST_OF_1
      ? 1
      : match.matchFormat === MatchFormat.BEST_OF_3
        ? 3
        : match.sets?.length || 3;

  useEffect(() => {
    if (isOpen) {
      // Initialize scores from existing sets or create empty scores
      if (match.sets && match.sets.length > 0) {
        const newScores = match.sets.map((set) => ({
          team1: set.player1Score || 0,
          team2: set.player2Score || 0,
        }));
        // Ensure we have enough scores for the number of games
        while (newScores.length < numberOfGames) {
          newScores.push({ team1: 0, team2: 0 });
        }
        // Trim to numberOfGames if we have more
        setScores(newScores.slice(0, numberOfGames));
      } else {
        // Initialize empty scores based on numberOfGames
        const newScores: Array<{ team1: number; team2: number }> = [];
        for (let i = 0; i < numberOfGames; i++) {
          newScores.push({ team1: 0, team2: 0 });
        }
        setScores(newScores);
      }
    }
  }, [isOpen, match, numberOfGames]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const sets = scores.slice(0, numberOfGames).map((score, index) => ({
        setNumber: index + 1,
        player1Score: score.team1,
        player2Score: score.team2,
      }));

      // Determine winner
      let team1Wins = 0;
      let team2Wins = 0;
      sets.forEach((set) => {
        if (set.player1Score > set.player2Score) team1Wins++;
        else if (set.player2Score > set.player1Score) team2Wins++;
      });

      const participants = match.participants || [];
      const winnerId =
        team1Wins > team2Wins
          ? participants[0]?.categoryRegistrationId
          : team2Wins > team1Wins
            ? participants[1]?.categoryRegistrationId
            : undefined;

      const scoreString = sets
        .map((s) => `${s.player1Score}-${s.player2Score}`)
        .join(', ');

      // The API now handles both ending matches and updating finished matches
      await CategoryService.endMatch(match.id, {
        sets,
        score: scoreString,
        winnerId,
        isDraw: team1Wins === team2Wins,
      });
      onSave();
    } catch (error) {
      console.error('Error saving scores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const participants = match.participants || [];
  const participant1 = participants[0]?.categoryRegistration;
  const participant2 = participants[1]?.categoryRegistration;

  const getTeamName = (reg?: CategoryRegistration) => {
    if (!reg) return t('unknown');
    if (reg.player) return reg.player.name;
    if (reg.pair) return reg.pair.name || t('pair');
    return t('unknown');
  };

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.600"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="md"
        maxW="600px"
        w="90%"
        maxH="90vh"
        overflowY="auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
          <Heading size="md">{t('matchScores')}</Heading>
        </Box>
        <Box p={4}>
          <VStack gap={4}>
            <Text fontWeight="bold">
              {getTeamName(participant1)} {t('vs')} {getTeamName(participant2)}
            </Text>

            {scores.slice(0, numberOfGames).map((score, index) => (
              <Box
                key={index}
                w="100%"
                p={4}
                borderWidth="1px"
                borderRadius="md"
              >
                <Text fontWeight="bold" mb={3}>
                  {t('game' + (index + 1))}
                </Text>
                <HStack gap={4}>
                  <Field.Root flex={1}>
                    <Field.Label>
                      {getTeamName(participant1)} {t('team1Score')}
                    </Field.Label>
                    <Input
                      type="number"
                      value={score.team1}
                      onChange={(e) => {
                        const newScores = [...scores];
                        newScores[index].team1 = parseInt(e.target.value) || 0;
                        setScores(newScores);
                      }}
                    />
                  </Field.Root>
                  <Field.Root flex={1}>
                    <Field.Label>
                      {getTeamName(participant2)} {t('team2Score')}
                    </Field.Label>
                    <Input
                      type="number"
                      value={score.team2}
                      onChange={(e) => {
                        const newScores = [...scores];
                        newScores[index].team2 = parseInt(e.target.value) || 0;
                        setScores(newScores);
                      }}
                    />
                  </Field.Root>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
        <Flex
          justify="flex-end"
          gap={3}
          p={4}
          borderTopWidth="1px"
          borderColor="gray.200"
        >
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button colorPalette="green" onClick={handleSave} loading={loading}>
            {t('save')}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
