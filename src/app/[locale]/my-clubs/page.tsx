'use client';

import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/chakra-compat';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import VModal from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  EMemberRole,
  EJoinRequestStatus,
  IClubJoinRequest,
  IMyClub,
  IClub,
} from '@/types/club';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  Separator,
  SimpleGrid,
  Spinner,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { UserRole } from '@/lib/api/types';
import { ROUTES } from '@/constants';
import { useCanAccessHostFeatures } from '@/hooks/useCanAccessHostFeatures';
import {
  ChevronRight,
  Check,
  ClipboardList,
  Clock,
  MapPin,
  Plus,
  Shield,
  UserCircle,
  Users,
  Settings,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

type RejectTarget =
  | { type: 'club'; clubId: string }
  | { type: 'member'; clubId: string; requestId: string };

export default function MyClubsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();

  const isHostOrAdmin = canAccessHostFeatures;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const [activeTab, setActiveTab] = useState<'managing' | 'member'>('managing');

  const [myClubs, setMyClubs] = useState<IMyClub[]>([]);
  const [joinRequests, setJoinRequests] = useState<IClubJoinRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IClubJoinRequest[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingIncoming, setIsLoadingIncoming] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [pendingClubs, setPendingClubs] = useState<IClub[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const isRejectDialogOpen = rejectTarget !== null;

  // Deduplicate: backend may return the same club from both the ClubMember
  // query and the host-based query; prefer ADMIN role when deduplicating.
  const uniqueClubs = Array.from(
    myClubs
      .reduce((map, club) => {
        const existing = map.get(club.id);
        if (!existing || club.role === EMemberRole.ADMIN) {
          map.set(club.id, club);
        }
        return map;
      }, new Map<string, IMyClub>())
      .values()
  );

  // A club is "managed" if the user has ADMIN role OR is the club host.
  // (HOST users who create clubs may not have a ClubMember record due to a
  //  backend quirk where hostName being set skips member creation, so
  //  checking host.id is the reliable fallback.)
  const isManaging = (c: IMyClub) =>
    c.role === EMemberRole.ADMIN || c.host.id === currentUser?.id;

  const managedClubs = uniqueClubs.filter(isManaging);
  const memberClubs = uniqueClubs.filter((c) => !isManaging(c));
  const pendingOutgoing = joinRequests.filter(
    (r) => r.status === EJoinRequestStatus.PENDING
  );

  const loadIncomingRequests = useCallback(
    async (clubs: IMyClub[], hostUserId?: string) => {
      const adminClubIds = clubs
        .filter((c) => c.role === EMemberRole.ADMIN || c.host.id === hostUserId)
        .map((c) => c.id);
      if (adminClubIds.length === 0) {
        setIncomingRequests([]);
        return;
      }
      try {
        setIsLoadingIncoming(true);
        const results = await Promise.all(
          adminClubIds.map((id) => ClubsService.getJoinRequests(id))
        );
        const pending = results
          .flat()
          .filter((r) => r.status === EJoinRequestStatus.PENDING);
        setIncomingRequests(pending);
      } catch (error) {
        console.error('Failed to load incoming requests:', error);
      } finally {
        setIsLoadingIncoming(false);
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    let loadedClubs: IMyClub[] = [];
    try {
      setIsLoading(true);
      const [clubs, requests] = await Promise.all([
        ClubsService.getMyClubs(),
        ClubsService.getMyJoinRequests(),
      ]);
      loadedClubs = clubs;
      setMyClubs(clubs);
      setJoinRequests(requests);
    } catch (error) {
      console.error('Failed to load my clubs data:', error);
    } finally {
      setIsLoading(false);
    }
    // Load incoming join requests separately so a failure here
    // doesn't prevent the main club list from rendering.
    loadIncomingRequests(loadedClubs, currentUser?.id);
  }, [currentUser, loadIncomingRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchPendingClubs = useCallback(async () => {
    try {
      setIsLoadingPending(true);
      const clubs = await ClubsService.getPendingClubs();
      setPendingClubs(clubs);
    } catch (error) {
      console.error('Failed to fetch pending clubs:', error);
      toaster.create({ title: t('clubs.failedToFetchClubs'), type: 'error' });
    } finally {
      setIsLoadingPending(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) fetchPendingClubs();
  }, [isAdmin, fetchPendingClubs]);

  const handleApprove = async (clubId: string) => {
    try {
      setIsActionLoading(true);
      await ClubsService.approveClub(clubId);
      toaster.create({
        title: t('clubs.adminApproval.approveSuccess'),
        type: 'success',
      });
      fetchPendingClubs();
    } catch (error) {
      console.error('Failed to approve club:', error);
      toaster.create({ title: t('common.error'), type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApproveJoinRequest = async (
    clubId: string,
    requestId: string
  ) => {
    try {
      setIsActionLoading(true);
      await ClubsService.approveJoinRequest(clubId, requestId);
      toaster.create({
        title: t('clubs.requestApprovedSuccessfully'),
        type: 'success',
      });
      await loadIncomingRequests(myClubs, currentUser?.id);
    } catch (error) {
      console.error('Failed to approve join request:', error);
      toaster.create({ title: t('common.error'), type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenRejectDialog = (target: RejectTarget) => {
    setRejectTarget(target);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    try {
      setIsActionLoading(true);
      if (rejectTarget.type === 'club') {
        await ClubsService.rejectClub(rejectTarget.clubId, rejectionReason);
        toaster.create({
          title: t('clubs.adminApproval.rejectSuccess'),
          type: 'success',
        });
        fetchPendingClubs();
      } else {
        await ClubsService.rejectJoinRequest(
          rejectTarget.clubId,
          rejectTarget.requestId,
          rejectionReason
        );
        toaster.create({
          title: t('clubs.requestRejectedSuccessfully'),
          type: 'success',
        });
        await loadIncomingRequests(myClubs, currentUser?.id);
      }
      setRejectTarget(null);
    } catch (error) {
      console.error('Failed to reject:', error);
      toaster.create({ title: t('common.error'), type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderClubCard = (club: IMyClub, isManaged: boolean) => (
    <Box
      key={club.id}
      p={6}
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="border"
      cursor={club.status === 'PENDING' ? 'default' : 'pointer'}
      onClick={() => {
        if (club.status !== 'PENDING') {
          router.push(`/clubs/${club.slug ?? club.id}`);
        }
      }}
      transition="all 0.2s"
      _hover={
        club.status === 'PENDING'
          ? {}
          : { shadow: 'md', transform: 'translateY(-2px)' }
      }
    >
      <HStack justify="space-between" mb={4}>
        <HStack gap={2}>
          <Heading size="md" lineClamp={1}>
            {club.name}
          </Heading>
          {club.status === 'PENDING' && (
            <Badge colorPalette="yellow" size="sm">
              {t('clubs.clubStatus.pending')}
            </Badge>
          )}
        </HStack>
        <HStack>
          {isManaged && (
            <Button
              size="sm"
              variant="ghost"
              colorPalette="gray"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/host/clubs/${club.id}/edit`);
              }}
            >
              <Settings size={16} />
            </Button>
          )}
          {club.status !== 'PENDING' && (
            <ChevronRight size={18} color="#CBD5E0" />
          )}
        </HStack>
      </HStack>

      <VStack align="start" gap={3} mb={4}>
        <HStack gap={2}>
          <UserCircle size={16} />
          <Text fontSize="sm" color="fg.muted" _dark={{ color: 'gray.400' }}>
            {t(
              `clubs.memberRole.${club.role.toLowerCase()}` as Parameters<
                typeof t
              >[0]
            )}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Users size={16} />
          <Text fontSize="sm" color="fg.muted" _dark={{ color: 'gray.400' }}>
            {club.memberCount} {t('clubs.members')}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Clock size={16} />
          <Text fontSize="xs" color="fg.muted">
            Joined {new Date(club.joinedAt).toLocaleDateString()}
          </Text>
        </HStack>
      </VStack>

      <Separator mb={4} />

      <HStack>
        <Text fontSize="xs" color="fg.muted">
          {t('clubs.hostedBy')}
        </Text>
        <Text fontSize="xs" fontWeight="bold">
          {club.host.name}
        </Text>
      </HStack>
    </Box>
  );

  if (isLoading) {
    return (
      <PageLayout title={t('navigation.manageGroups')}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={t('navigation.manageGroups')}>
      <Text color="fg.muted" _dark={{ color: 'gray.400' }} mb={8}>
        {t('clubs.manageMyClubsDescription')}
      </Text>

      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value as 'managing' | 'member')}
        variant="enclosed"
      >
        <Tabs.List mb={6}>
          <Tabs.Trigger value="managing" gap={2}>
            <Shield size={16} />
            {t('clubs.managingGroups')}
            {managedClubs.length > 0 && (
              <Badge colorPalette="green" size="xs" borderRadius="full">
                {managedClubs.length}
              </Badge>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger value="member" gap={2}>
            <Users size={16} />
            {t('clubs.memberClubsTab')}
            {memberClubs.length > 0 && (
              <Badge colorPalette="blue" size="xs" borderRadius="full">
                {memberClubs.length}
              </Badge>
            )}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="managing">
          <VStack gap={10} align="stretch">
            <Box>
              <HStack mb={6} gap={2} justify="space-between">
                <HStack gap={2}>
                  <Shield size={20} />
                  <Heading size="lg">{t('clubs.managingGroups')}</Heading>
                  <Badge
                    colorPalette="green"
                    variant="subtle"
                    borderRadius="full"
                    px={2}
                  >
                    {managedClubs.length}
                  </Badge>
                </HStack>
                {isHostOrAdmin && (
                  <Button
                    colorPalette="green"
                    size="sm"
                    onClick={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
                  >
                    <Plus size={16} />
                    {t('navigation.createClub')}
                  </Button>
                )}
              </HStack>

              {managedClubs.length === 0 ? (
                <VStack
                  py={12}
                  bg="bg.muted"
                  _dark={{ bg: 'gray.900/40' }}
                  borderRadius="2xl"
                  gap={4}
                  borderWidth="1px"
                  borderStyle="dashed"
                >
                  <Shield size={48} color="#A0AEC0" />
                  <Text color="fg.muted">{t('clubs.noManagedClubs')}</Text>
                  {isHostOrAdmin && (
                    <Button
                      colorPalette="green"
                      variant="outline"
                      onClick={() => router.push(ROUTES.HOST.CLUBS.CREATE)}
                    >
                      <Plus size={16} />
                      {t('clubs.createClub')}
                    </Button>
                  )}
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                  {managedClubs.map((club) => renderClubCard(club, true))}
                </SimpleGrid>
              )}
            </Box>

            <Box>
              <HStack mb={6} gap={2}>
                <ClipboardList size={20} />
                <Heading size="lg">{t('clubs.joinRequests')}</Heading>
                {incomingRequests.length > 0 && (
                  <Badge
                    colorPalette="orange"
                    variant="subtle"
                    borderRadius="full"
                    px={2}
                  >
                    {incomingRequests.length}
                  </Badge>
                )}
              </HStack>

              {isLoadingIncoming ? (
                <Flex justify="center" align="center" minH="100px">
                  <Spinner size="md" colorPalette="green" />
                </Flex>
              ) : incomingRequests.length === 0 ? (
                <VStack
                  py={10}
                  bg="bg.muted"
                  _dark={{ bg: 'gray.900/40' }}
                  borderRadius="2xl"
                >
                  <Text color="fg.muted">{t('clubs.noPendingRequests')}</Text>
                </VStack>
              ) : (
                <VStack gap={4} align="stretch">
                  {incomingRequests.map((request) => (
                    <Flex
                      key={request.id}
                      p={5}
                      bg="bg"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="border"
                      align="center"
                      justify="space-between"
                    >
                      <HStack gap={4}>
                        <Box
                          p={3}
                          bg="blue.50"
                          _dark={{ bg: 'blue.900/20' }}
                          borderRadius="lg"
                        >
                          <UserCircle size={24} color="#3182CE" />
                        </Box>
                        <Box>
                          <Heading size="sm" mb={1}>
                            {request.user.name}
                          </Heading>
                          <Text fontSize="xs" color="fg.muted">
                            {request.club?.name} &middot;{' '}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Text>
                        </Box>
                      </HStack>
                      <HStack gap={2}>
                        <Button
                          size="sm"
                          colorPalette="green"
                          onClick={() =>
                            handleApproveJoinRequest(request.clubId, request.id)
                          }
                          loading={isActionLoading}
                        >
                          <Check size={14} />
                          {t('clubs.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorPalette="red"
                          onClick={() =>
                            handleOpenRejectDialog({
                              type: 'member',
                              clubId: request.clubId,
                              requestId: request.id,
                            })
                          }
                          loading={isActionLoading}
                        >
                          <X size={14} />
                          {t('clubs.reject')}
                        </Button>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </Tabs.Content>

        <Tabs.Content value="member">
          <VStack gap={10} align="stretch">
            <Box>
              <HStack mb={6} gap={2}>
                <Users size={20} />
                <Heading size="lg">{t('clubs.memberClubsTab')}</Heading>
                <Badge
                  colorPalette="blue"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                >
                  {memberClubs.length}
                </Badge>
              </HStack>

              {memberClubs.length === 0 ? (
                <VStack
                  py={12}
                  bg="bg.muted"
                  _dark={{ bg: 'gray.900/40' }}
                  borderRadius="2xl"
                  gap={4}
                  borderWidth="1px"
                  borderStyle="dashed"
                >
                  <Users size={48} color="#A0AEC0" />
                  <Text color="fg.muted">{t('clubs.noMemberClubsTab')}</Text>
                  <Button
                    colorPalette="green"
                    variant="outline"
                    onClick={() => router.push('/clubs')}
                  >
                    {t('clubs.browseClubs')}
                  </Button>
                </VStack>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                  {memberClubs.map((club) => renderClubCard(club, false))}
                </SimpleGrid>
              )}
            </Box>

            <Box>
              <HStack mb={6} gap={2}>
                <Clock size={20} />
                <Heading size="lg">{t('clubs.awaitingApproval')}</Heading>
                {pendingOutgoing.length > 0 && (
                  <Badge
                    colorPalette="orange"
                    variant="subtle"
                    borderRadius="full"
                    px={2}
                  >
                    {pendingOutgoing.length}
                  </Badge>
                )}
              </HStack>

              {pendingOutgoing.length === 0 ? (
                <VStack
                  py={10}
                  bg="bg.muted"
                  _dark={{ bg: 'gray.900/40' }}
                  borderRadius="2xl"
                >
                  <Text color="fg.muted">{t('clubs.noAwaitingApproval')}</Text>
                </VStack>
              ) : (
                <VStack gap={4} align="stretch">
                  {pendingOutgoing.map((request) => (
                    <Flex
                      key={request.id}
                      p={5}
                      bg="bg"
                      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="border"
                      align="center"
                      justify="space-between"
                    >
                      <HStack gap={4}>
                        <Box
                          p={3}
                          bg="orange.50"
                          _dark={{ bg: 'orange.900/20' }}
                          borderRadius="lg"
                        >
                          <Clock size={24} color="#DD6B20" />
                        </Box>
                        <Box>
                          <Heading size="sm" mb={1}>
                            {request.club?.name}
                          </Heading>
                          <Text fontSize="xs" color="fg.muted">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </Text>
                        </Box>
                      </HStack>
                      <HStack gap={4}>
                        <Badge colorPalette="orange">{request.status}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(
                              `/clubs/${request.club?.slug ?? request.club?.id}`
                            )
                          }
                        >
                          {t('common.view')}
                        </Button>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>
          </VStack>
        </Tabs.Content>
      </Tabs.Root>

      {isAdmin && (
        <Box mt={12}>
          <HStack mb={6} gap={2} justify="space-between">
            <HStack gap={2}>
              <Shield size={20} />
              <Heading size="lg">{t('clubs.adminApproval.title')}</Heading>
              {pendingClubs.length > 0 && (
                <Badge
                  colorPalette="yellow"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                >
                  {pendingClubs.length}
                </Badge>
              )}
            </HStack>
            <Button
              colorPalette="green"
              size="sm"
              onClick={() => router.push('/admin/clubs/create')}
            >
              <Plus size={16} />
              {t('clubs.adminApproval.createClub')}
            </Button>
          </HStack>

          {isLoadingPending ? (
            <Flex justify="center" align="center" minH="200px">
              <Spinner size="xl" colorPalette="green" />
            </Flex>
          ) : pendingClubs.length === 0 ? (
            <VStack
              py={12}
              bg="bg.muted"
              _dark={{ bg: 'gray.900/40' }}
              borderRadius="2xl"
              gap={4}
              borderWidth="1px"
              borderStyle="dashed"
            >
              <Shield size={48} color="#A0AEC0" />
              <Text color="fg.muted">
                {t('clubs.adminApproval.noPendingClubs')}
              </Text>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
              {pendingClubs.map((club) => (
                <Box
                  key={club.id}
                  p={6}
                  bg="bg"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="border"
                  _hover={{ shadow: 'md' }}
                >
                  <Flex gap={4}>
                    <Box
                      w="100px"
                      h="100px"
                      borderRadius="lg"
                      overflow="hidden"
                      bg="gray.100"
                      flexShrink={0}
                    >
                      {club.image ? (
                        <Image
                          src={club.image}
                          alt={club.name}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      ) : (
                        <Flex
                          w="full"
                          h="full"
                          align="center"
                          justify="center"
                          bg={club.color || 'green.500'}
                        >
                          <Users size={32} color="white" />
                        </Flex>
                      )}
                    </Box>
                    <VStack align="start" flex={1} gap={2}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold" fontSize="xl">
                          {club.name}
                        </Text>
                        <Badge colorPalette="yellow">
                          {t('clubs.clubStatus.pending')}
                        </Badge>
                      </HStack>
                      <HStack
                        fontSize="sm"
                        color="fg.muted"
                        _dark={{ color: 'gray.400' }}
                      >
                        <MapPin size={14} />
                        <Text>{club.location || t('common.notSpecified')}</Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        lineClamp={2}
                        color="gray.500"
                        dangerouslySetInnerHTML={{
                          __html: club.description || t('clubs.noDescription'),
                        }}
                        css={{
                          '& p': { display: 'inline' },
                          '& br': { display: 'none' },
                          '& *': { margin: 0, padding: 0 },
                        }}
                      />
                      <HStack pt={2} fontSize="xs" color="gray.400">
                        <Text>{t('clubs.hostedBy')}</Text>
                        <Text
                          fontWeight="medium"
                          color="fg.muted"
                          _dark={{ color: 'gray.300' }}
                        >
                          {club.host.name}
                        </Text>
                      </HStack>
                    </VStack>
                  </Flex>

                  <Flex mt={6} gap={3}>
                    <Button
                      flex={1}
                      colorPalette="green"
                      onClick={() => handleApprove(club.id)}
                      loading={isActionLoading}
                    >
                      <Check size={18} />
                      {t('clubs.approve')}
                    </Button>
                    <Button
                      flex={1}
                      variant="outline"
                      colorPalette="red"
                      onClick={() =>
                        handleOpenRejectDialog({
                          type: 'club',
                          clubId: club.id,
                        })
                      }
                      loading={isActionLoading}
                    >
                      <X size={18} />
                      {t('clubs.reject')}
                    </Button>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}

      <VModal
        isOpen={isRejectDialogOpen}
        onClose={() => setRejectTarget(null)}
        title={t('clubs.reject')}
        primaryActionText={t('clubs.reject')}
        onPrimaryAction={handleReject}
        isPrimaryLoading={isActionLoading}
        primaryColorScheme="red"
        secondaryActionText={t('common.cancel')}
        isPrimaryDisabled={!rejectionReason.trim()}
      >
        <Field
          label={t('clubs.rejectionReason', { reason: '' }).replace(': ', '')}
          required
        >
          <Input
            placeholder={t('clubs.joinMessagePlaceholder')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </Field>
      </VModal>
    </PageLayout>
  );
}
