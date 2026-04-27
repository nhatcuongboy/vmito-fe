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
import { EJoinRequestStatus, IClubJoinRequest, IMyClub } from '@/types/club';
import { IClub } from '@/types/club';
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

export default function MyClubsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { canAccessHostFeatures } = useCanAccessHostFeatures();

  const isHostOrAdmin = canAccessHostFeatures;

  const [myClubs, setMyClubs] = useState<IMyClub[]>([]);
  const [joinRequests, setJoinRequests] = useState<IClubJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin club approval state
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const [pendingClubs, setPendingClubs] = useState<IClub[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [clubs, requests] = await Promise.all([
        ClubsService.getMyClubs(),
        ClubsService.getMyJoinRequests(),
      ]);
      setMyClubs(clubs);
      setJoinRequests(requests);
    } catch (error) {
      console.error('Failed to load my clubs data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

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

  const handleOpenRejectDialog = (clubId: string) => {
    setSelectedClubId(clubId);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedClubId || !rejectionReason.trim()) return;
    try {
      setIsActionLoading(true);
      await ClubsService.rejectClub(selectedClubId, rejectionReason);
      toaster.create({
        title: t('clubs.adminApproval.rejectSuccess'),
        type: 'success',
      });
      setIsRejectDialogOpen(false);
      fetchPendingClubs();
    } catch (error) {
      console.error('Failed to reject club:', error);
      toaster.create({ title: t('common.error'), type: 'error' });
    } finally {
      setIsActionLoading(false);
    }
  };

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

      {/* Section 1: Joined Clubs */}
      <Box mb={12}>
        <HStack mb={6} gap={2} justify="space-between">
          <HStack gap={2}>
            <Users size={20} />
            <Heading size="lg">{t('clubs.myClubs')}</Heading>
            <Badge
              colorPalette="green"
              variant="subtle"
              borderRadius="full"
              px={2}
            >
              {myClubs.length}
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

        {myClubs.length === 0 ? (
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
            <Text color="fg.muted">{t('clubs.noClubsFound')}</Text>
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
            {myClubs.map((club) => (
              <Box
                key={club.id}
                p={6}
                bg="bg"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border"
                cursor="pointer"
                onClick={() => router.push(`/clubs/${club.slug ?? club.id}`)}
                transition="all 0.2s"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
              >
                <HStack justify="space-between" mb={4}>
                  <Heading size="md" lineClamp={1}>
                    {club.name}
                  </Heading>
                  <HStack>
                    {(club.role === 'ADMIN' ||
                      club.host.id === currentUser?.id) && (
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
                    <ChevronRight size={18} color="#CBD5E0" />
                  </HStack>
                </HStack>

                <VStack align="start" gap={3} mb={4}>
                  <HStack gap={2}>
                    <UserCircle size={16} />
                    <Text
                      fontSize="sm"
                      color="fg.muted"
                      _dark={{ color: 'gray.400' }}
                    >
                      {t(`clubs.memberRole.${club.role.toLowerCase()}` as any)}
                    </Text>
                  </HStack>
                  <HStack gap={2}>
                    <Users size={16} />
                    <Text
                      fontSize="sm"
                      color="fg.muted"
                      _dark={{ color: 'gray.400' }}
                    >
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
                    Hosted by
                  </Text>
                  <Text fontSize="xs" fontWeight="bold">
                    {club.host.name}
                  </Text>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Section 2: Pending Requests */}
      <Box>
        <HStack mb={6} gap={2}>
          <ClipboardList size={20} />
          <Heading size="lg">{t('clubs.pendingRequest')}</Heading>
          {joinRequests.length > 0 && (
            <Badge
              colorPalette="orange"
              variant="subtle"
              borderRadius="full"
              px={2}
            >
              {joinRequests.length}
            </Badge>
          )}
        </HStack>

        {joinRequests.length === 0 ? (
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
            {joinRequests.map((request) => (
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
                      Requested on{' '}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                  </Box>
                </HStack>

                <HStack gap={4}>
                  <Badge
                    colorPalette={
                      request.status === EJoinRequestStatus.PENDING
                        ? 'orange'
                        : request.status === EJoinRequestStatus.APPROVED
                          ? 'green'
                          : 'red'
                    }
                  >
                    {request.status}
                  </Badge>
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

      {/* Section 3: Admin — Club Approval */}
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
                      <Text fontSize="sm" lineClamp={2} color="gray.500">
                        {club.description || t('clubs.noDescription')}
                      </Text>
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
                      onClick={() => handleOpenRejectDialog(club.id)}
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

      {/* Rejection Dialog */}
      <VModal
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
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
