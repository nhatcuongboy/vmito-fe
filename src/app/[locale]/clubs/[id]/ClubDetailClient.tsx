'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  HStack,
  Badge,
  SimpleGrid,
  Spinner,
  VStack,
  Avatar,
  Image,
  Grid,
  Tabs,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { RichTextDisplay } from '@/components/ui/RichTextDisplay';
import AppHostDetail from '@/components/session/AppHostDetail';
import { VModal } from '@/components/ui/VModal';
import {
  MapPin,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  DollarSign,
  Info,
  Image as ImageIcon,
  TrendingUp,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ISession, UserRole } from '@/lib/api/types';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub, EMemberRole, EJoinRequestStatus } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import PageLayout from '@/components/layout/PageLayout';
import DetailViewCountFooter from '@/components/common/DetailViewCountFooter';
import { sortLevelsByRank } from '@/constants/levels';
import { DEFAULT_COVER_PHOTO, ROUTES } from '@/constants';
import { getGoogleMapsUrl } from '@/utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import SessionMap from '@/components/session/SessionMap';

interface ClubDetailClientProps {
  initialClub: IClub | null;
}

const LEVEL_NAME_TO_NUMBER: Record<string, number> = {
  BEGINNER: 1,
  ADVANCED_BEGINNER: 2,
  LOW_INTERMEDIATE: 3,
  INTERMEDIATE: 4,
  HIGH_INTERMEDIATE: 5,
  ADVANCED: 6,
  SEMI_PRO: 7,
  PRO: 8,
};

const extractLevelNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    return LEVEL_NAME_TO_NUMBER[value.trim().toUpperCase()] ?? null;
  }

  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  return (
    extractLevelNumber(record.level) ??
    extractLevelNumber(record.value) ??
    extractLevelNumber(record.name) ??
    extractLevelNumber(record.code) ??
    extractLevelNumber(record.levelNumber) ??
    extractLevelNumber(record.levelValue)
  );
};

const getClubRequiredLevels = (club: IClub | null): number[] => {
  if (!club) return [];

  const clubRecord = club as IClub & {
    levels?: unknown[];
    clubLevels?: unknown[];
    requiredLevelIds?: unknown[];
    requiredSkillLevels?: unknown[];
    skillLevels?: unknown[];
    playerLevels?: unknown[];
  };
  const rawLevels =
    clubRecord.requiredLevels ??
    clubRecord.requiredLevelIds ??
    clubRecord.requiredSkillLevels ??
    clubRecord.skillLevels ??
    clubRecord.playerLevels ??
    clubRecord.levels ??
    clubRecord.clubLevels ??
    [];
  const rawLevelValues = Array.isArray(rawLevels) ? rawLevels : [rawLevels];

  const uniqueLevels = Array.from(
    new Set(
      rawLevelValues
        .map(extractLevelNumber)
        .filter((l): l is number => l !== null)
    )
  );
  return sortLevelsByRank(uniqueLevels);
};

const getVenueNameFromScheduleNote = (note?: string): string | null => {
  if (!note) return null;
  return note.split('|')[0]?.trim() || null;
};

const getVenueAddressLineFromScheduleNote = (note?: string): string | null => {
  if (!note) return null;
  const [name, ...addressParts] = note.split('|').map((part) => part.trim());
  const address = addressParts.join(' | ');
  return address ? `${name} | ${address}` : name || null;
};

const getVenueAddressLine = (venue: IClub['defaultVenue']): string | null => {
  if (!venue) return null;
  return [venue.name, venue.address].filter(Boolean).join(' | ') || null;
};

export default function ClubDetailClient({
  initialClub,
}: ClubDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const { user: currentUser } = useAuthStore();
  const { getLevelLabel, getLevelShortLabel } = useLevelLabel();

  const [club, setClub] = useState<IClub | null>(initialClub);
  const [isLoading, setIsLoading] = useState(!initialClub);
  const [activeTab, setActiveTab] = useState('about');
  const [isJoining, setIsJoining] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isHostDetailModalOpen, setIsHostDetailModalOpen] = useState(false);
  const [visibleMembersCount, setVisibleMembersCount] = useState(8);

  const loadClubDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const [data, myRequests] = await Promise.all([
        ClubsService.getClubDetails(clubId),
        ClubsService.getMyJoinRequests().catch(() => []),
      ]);
      setClub(data);
      const pending = myRequests.some(
        (r) => r.clubId === clubId && r.status === EJoinRequestStatus.PENDING
      );
      setHasPendingRequest(pending);
    } catch (error) {
      console.error('Failed to load club details:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsLoading(false);
    }
  }, [clubId, t]);

  useEffect(() => {
    if (initialClub) return;

    if (clubId) {
      loadClubDetails();
    }
  }, [clubId, loadClubDetails, initialClub]);

  useEffect(() => {
    setVisibleMembersCount(8);
  }, [clubId]);

  // Hiển thị đầy đủ các trình độ đã chọn
  const getLevelRange = () => {
    const requiredLevels = getClubRequiredLevels(club);
    if (requiredLevels.length > 0) {
      return requiredLevels.map((l) => getLevelShortLabel(l)).join(', ');
    }

    // Fallback: Calculate from members
    if (!club?.members || club.members.length === 0) return null;
    const levels = club.members
      .map((m) => m.user.level)
      .filter((l): l is number => l !== undefined && l !== null);

    if (levels.length === 0) return null;
    const uniqueLevels = sortLevelsByRank(Array.from(new Set(levels)));
    return uniqueLevels.map((l) => getLevelShortLabel(l)).join(', ');
  };

  const isUserMember = club?.members?.some(
    (m) => m.user.id === currentUser?.id
  );

  const isUserAdmin =
    !!currentUser &&
    (currentUser.role === UserRole.ADMIN ||
      (club?.hostId && String(club.hostId) === String(currentUser.id)) ||
      (club?.host?.id && String(club.host.id) === String(currentUser.id)) ||
      club?.members?.some(
        (m) =>
          (String(m.userId) === String(currentUser.id) ||
            String(m?.user?.id) === String(currentUser.id)) &&
          m.role === EMemberRole.ADMIN
      ));

  const linkedHostMember = club?.members?.find((member) => {
    if (member.role !== EMemberRole.ADMIN) return false;

    if (club.hostName) {
      return member.user.name === club.hostName;
    }

    return (
      String(member.user.id) === String(club.hostId || club.host?.id) ||
      member.user.id === club.host?.id
    );
  });
  const linkedHostUser = linkedHostMember?.user;
  const hostRealName =
    club?.hostName || linkedHostUser?.name || club?.host?.name;
  const canShowHostDetail = Boolean(linkedHostUser?.id);

  const handleJoinClub = async () => {
    if (!currentUser) {
      router.push(ROUTES.AUTH.SIGNIN);
      return;
    }
    if (!club) return;

    try {
      setIsJoining(true);
      const result = await ClubsService.requestToJoin(club.id);
      toaster.success({
        title:
          result.status === 'joined'
            ? t('clubs.joinedSuccessfully')
            : t('clubs.joinRequestSent'),
      });
      if (result.status === 'pending') {
        setHasPendingRequest(true);
      }
      await loadClubDetails();
    } catch (error) {
      console.error('Failed to join club:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsJoining(false);
    }
  };

  const visibleMembers = club?.members?.slice(0, visibleMembersCount) ?? [];
  const hasMoreMembers = (club?.members?.length ?? 0) > visibleMembersCount;

  const handleOpenUserProfile = (userId: string) => {
    router.push(ROUTES.USER.PROFILE(userId));
  };

  if (isLoading) {
    return (
      <PageLayout title={t('clubs.clubDetails')}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" colorPalette="green" />
        </Flex>
      </PageLayout>
    );
  }

  if (!club) {
    return (
      <PageLayout title={t('common.error')}>
        <Container maxW="container.md" py={16} textAlign="center">
          <Heading mb={4}>{t('common.error')}</Heading>
          <Button
            colorPalette="green"
            onClick={() => router.push(ROUTES.CLUBS.BROWSE)}
          >
            {t('common.back')}
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const clubDisplayImage = club.image || DEFAULT_COVER_PHOTO;

  return (
    <PageLayout
      title={
        <HStack gap={2} align="center">
          <Box
            w="32px"
            h="32px"
            display={{ base: 'flex', md: 'none' }}
            borderRadius="md"
            overflow="hidden"
            bg="gray.100"
            flexShrink={0}
            alignItems="center"
            justifyContent="center"
          >
            <Image
              src={clubDisplayImage}
              alt={club.name}
              objectFit="cover"
              w="full"
              h="full"
            />
          </Box>
          <Text truncate fontWeight="bold">
            {club.name}
          </Text>
        </HStack>
      }
    >
      {/* Hero Section */}
      <Container maxW="container.xl" px={0}>
        <Box
          position="relative"
          w="full"
          h={{ base: '180px', md: '300px' }}
          borderRadius="2xl"
          overflow="hidden"
          mb={4}
        >
          <Image
            src={clubDisplayImage}
            alt={club.name}
            w="full"
            h="full"
            objectFit="cover"
          />
          {/* Gradient Overlay */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="100px"
            bgGradient="to-t"
            gradientFrom="blackAlpha.600"
            gradientTo="transparent"
            pointerEvents="none"
          />
        </Box>

        {/* Info Card */}
        <Box
          w="full"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          shadow="sm"
          px={{ base: 3, md: 5 }}
          py={{ base: 2, md: 3.5 }}
          borderWidth="1px"
          borderColor="gray.100"
          mb={4}
        >
          <Flex gap={{ base: 3, md: 4 }} align="center">
            <Box
              w="48px"
              h="48px"
              flexShrink={0}
              shadow="sm"
              borderRadius="lg"
              overflow="hidden"
              bg="gray.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderColor="gray.100"
            >
              <Image
                src={clubDisplayImage}
                alt={club.name}
                objectFit="cover"
                w="full"
                h="full"
              />
            </Box>
            <Box flex="1" minW="0">
              <Heading
                size={{ base: 'lg', md: 'xl' }}
                mb={0}
                letterSpacing="tight"
                lineClamp={1}
              >
                {club.name}
              </Heading>
              {(() => {
                const firstVenue =
                  club.scheduleVenues?.[0] || club.defaultVenue;
                const locationParts = [
                  firstVenue?.district,
                  firstVenue?.city,
                ].filter(Boolean);
                return locationParts.length > 0 ? (
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    _dark={{ color: 'gray.400' }}
                    mt={1}
                  >
                    {locationParts.join(', ')}
                  </Text>
                ) : null;
              })()}
            </Box>
          </Flex>
        </Box>
      </Container>

      {/* Navigation Tabs & Content */}
      <Container maxW="container.xl" pb={8} px={0}>
        <Tabs.Root
          value={activeTab}
          onValueChange={(e) => setActiveTab(e.value)}
          variant="plain"
        >
          <Tabs.List
            position="sticky"
            top="0"
            zIndex="10"
            bg="white"
            _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
            shadow="sm"
            borderRadius="2xl"
            p={1.5}
            mb={6}
            gap={1}
            borderWidth="1px"
            borderColor="gray.100"
            overflowX="auto"
            scrollbarWidth="none"
            css={{ '&::-webkit-scrollbar': { display: 'none' } }}
            display="flex"
            flexWrap="nowrap"
          >
            <Tabs.Trigger
              value="about"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <Info size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                {t('clubs.aboutTab')}
              </Text>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="members"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <Users size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                {t('clubs.membersTab')}
              </Text>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="schedule"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <Calendar size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                {t('clubs.schedule')}
              </Text>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="announcements"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <MessageSquare size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                {t('clubs.announcementsTab')}
              </Text>
              {club.announcements && club.announcements.length > 0 && (
                <Badge
                  colorPalette="blue"
                  size="xs"
                  ml={1}
                  variant="solid"
                  borderRadius="full"
                >
                  {club.announcements.length}
                </Badge>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="photos"
              gap={2}
              borderRadius="xl"
              px={5}
              py={2}
              flexShrink={0}
              whiteSpace="nowrap"
              _selected={{ bg: 'green.100', color: 'green.700', shadow: 'sm' }}
              _dark={{ _selected: { bg: 'green.900/40', color: 'green.300' } }}
            >
              <ImageIcon size={16} />
              <Text fontSize="sm" fontWeight="semibold">
                {t('clubs.clubImage')}
              </Text>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Grid Layout 7:3 */}
          <Grid
            templateColumns={{ base: '1fr', lg: '2.3fr 1fr' }}
            gap={6}
            mt={0}
          >
            {/* Main Content - Left Column */}
            <Box>
              {/* Tab Content: About */}
              <Tabs.Content value="about" pt={0}>
                <VStack gap={6} align="stretch">
                  <Box
                    p={6}
                    pb={8}
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="gray.100"
                    shadow="sm"
                  >
                    {/* Description */}
                    <Box>
                      <Heading
                        size="md"
                        mb={4}
                        fontFamily="var(--font-geist-sans)"
                        fontWeight="bold"
                      >
                        Giới thiệu về nhóm
                      </Heading>
                      {club.description ? (
                        <RichTextDisplay content={club.description} />
                      ) : (
                        <Text fontSize="sm" color="gray.400" fontStyle="italic">
                          {t('clubs.noDescription')}
                        </Text>
                      )}
                    </Box>
                  </Box>
                </VStack>
              </Tabs.Content>

              {/* Tab Content: Members */}
              <Tabs.Content value="members" pt={0}>
                <Box
                  p={6}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  shadow="sm"
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="md">{t('clubs.clubMembers')}</Heading>
                    <Badge colorPalette="gray" size="sm">
                      {club.memberCount} {t('clubs.members')}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.500" mb={5}>
                    {t('clubs.showingMembers', {
                      visible: visibleMembers.length,
                      total: club.memberCount,
                    })}
                  </Text>

                  {visibleMembers.length > 0 ? (
                    <>
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                        {visibleMembers.map((member) => (
                          <Flex
                            key={member.id}
                            p={4}
                            bg="gray.50"
                            borderRadius="2xl"
                            borderWidth="1px"
                            borderColor="gray.100"
                            _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                            align="center"
                            gap={3}
                            transition="all 0.2s"
                            cursor="pointer"
                            onClick={() =>
                              handleOpenUserProfile(member.user.id)
                            }
                            _hover={{
                              bg: 'gray.100',
                              _dark: { bg: 'gray.800' },
                              shadow: 'sm',
                            }}
                          >
                            <Avatar.Root size="lg">
                              <Avatar.Image
                                src={member.user.image}
                                objectFit="cover"
                              />
                              <Avatar.Fallback>
                                {member.user.name[0]}
                              </Avatar.Fallback>
                            </Avatar.Root>
                            <Box flex="1" minW={0}>
                              <Text
                                fontWeight="semibold"
                                fontSize="sm"
                                lineClamp={1}
                              >
                                {member.user.name}
                              </Text>
                              <HStack gap={2} mt={1}>
                                <Badge
                                  size="xs"
                                  colorPalette={
                                    member.role === EMemberRole.ADMIN
                                      ? 'orange'
                                      : member.role === EMemberRole.MODERATOR
                                        ? 'blue'
                                        : 'gray'
                                  }
                                  variant="subtle"
                                >
                                  {t(
                                    `clubs.memberRole.${member.role.toLowerCase() as 'admin' | 'moderator' | 'member'}`
                                  )}
                                </Badge>
                                {member.user.level && (
                                  <Text fontSize="xs" color="gray.500">
                                    {getLevelLabel(member.user.level)}
                                  </Text>
                                )}
                              </HStack>
                            </Box>
                            <ExternalLink
                              size={14}
                              color="var(--chakra-colors-gray-400)"
                            />
                          </Flex>
                        ))}
                      </SimpleGrid>
                      {hasMoreMembers && (
                        <Flex justify="center" mt={4}>
                          <Button
                            variant="outline"
                            colorPalette="green"
                            size="sm"
                            onClick={() =>
                              setVisibleMembersCount((prev) => prev + 8)
                            }
                          >
                            {t('clubs.viewMoreMembers')}
                          </Button>
                        </Flex>
                      )}
                    </>
                  ) : (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      py={10}
                      color="gray.400"
                      gap={2}
                    >
                      <Users size={40} strokeWidth={1.2} />
                      <Text fontSize="sm" fontStyle="italic">
                        {t('clubs.adminApproval.noMembersYet')}
                      </Text>
                    </Flex>
                  )}
                </Box>
              </Tabs.Content>

              {/* Tab Content: Schedule */}
              <Tabs.Content value="schedule" pt={0}>
                <Box
                  p={6}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  shadow="sm"
                >
                  <Heading size="md" mb={5}>
                    {t('clubs.schedule')}
                  </Heading>

                  {club.schedules && club.schedules.length > 0 ? (
                    <VStack gap={3} align="stretch">
                      {club.schedules
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((schedule) => (
                          <Flex
                            key={schedule.id}
                            p={4}
                            bg="gray.50"
                            borderRadius="2xl"
                            borderWidth="1px"
                            borderColor="gray.100"
                            _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                            align="center"
                            gap={4}
                          >
                            <Flex
                              w="50px"
                              h="50px"
                              borderRadius="lg"
                              bg="blue.100"
                              _dark={{ bg: 'blue.900' }}
                              align="center"
                              justify="center"
                              flexShrink={0}
                            >
                              <Calendar
                                size={24}
                                color="var(--chakra-colors-blue-600)"
                              />
                            </Flex>
                            <Box flex="1">
                              <Text fontWeight="bold" fontSize="sm">
                                {t(
                                  `clubs.dayNames.${schedule.dayOfWeek}` as Parameters<
                                    typeof t
                                  >[0]
                                )}
                              </Text>
                              <Text
                                fontSize="sm"
                                color="gray.600"
                                _dark={{ color: 'gray.400' }}
                              >
                                {schedule.startTime} - {schedule.endTime}
                              </Text>
                              {schedule.notes && (
                                <Box mt={1}>
                                  {schedule.notes.includes('|') ? (
                                    <>
                                      <Text
                                        fontWeight="medium"
                                        fontSize="xs"
                                        color="gray.700"
                                        _dark={{ color: 'gray.300' }}
                                      >
                                        {schedule.notes.split('|')[0].trim()}
                                      </Text>
                                      <Text fontSize="2xs" color="gray.500">
                                        {schedule.notes.split('|')[1].trim()}
                                      </Text>
                                    </>
                                  ) : (
                                    <Text fontSize="xs" color="gray.500">
                                      {schedule.notes}
                                    </Text>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Flex>
                        ))}
                    </VStack>
                  ) : (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      py={10}
                      color="gray.400"
                      gap={2}
                    >
                      <Calendar size={40} strokeWidth={1.2} />
                      <Text fontSize="sm" fontStyle="italic">
                        {t('clubs.noSchedule')}
                      </Text>
                    </Flex>
                  )}
                </Box>
              </Tabs.Content>

              {/* Tab Content: Announcements */}
              <Tabs.Content value="announcements" pt={0}>
                <Box
                  p={6}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  shadow="sm"
                >
                  <Heading size="md" mb={5}>
                    {t('clubs.recentAnnouncements')}
                  </Heading>

                  {club.announcements && club.announcements.length > 0 ? (
                    <VStack gap={4} align="stretch">
                      {club.announcements.map((announcement) => (
                        <Box
                          key={announcement.id}
                          p={5}
                          bg="gray.50"
                          borderRadius="2xl"
                          borderWidth="1px"
                          borderColor="gray.100"
                          _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                        >
                          <Flex justify="space-between" align="start" mb={3}>
                            <Heading size="sm">{announcement.title}</Heading>
                            {announcement.pinnedUntil &&
                              new Date(announcement.pinnedUntil) >
                                new Date() && (
                                <Badge colorPalette="orange" size="sm">
                                  Pinned
                                </Badge>
                              )}
                          </Flex>
                          <Text
                            color="gray.600"
                            _dark={{ color: 'gray.400' }}
                            lineHeight="tall"
                            mb={4}
                          >
                            {announcement.content}
                          </Text>
                          <Flex justify="space-between" align="center">
                            <HStack gap={2}>
                              <Avatar.Root size="sm">
                                <Avatar.Image
                                  src={announcement.author.image}
                                  objectFit="cover"
                                />
                                <Avatar.Fallback>
                                  {announcement.author.name[0]}
                                </Avatar.Fallback>
                              </Avatar.Root>
                              <Text fontSize="sm" fontWeight="medium">
                                {announcement.author.name}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(
                                announcement.createdAt
                              ).toLocaleDateString()}
                            </Text>
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      py={10}
                      color="gray.400"
                      gap={2}
                    >
                      <MessageSquare size={40} strokeWidth={1.2} />
                      <Text fontSize="sm" fontStyle="italic">
                        {t('clubs.noAnnouncements')}
                      </Text>
                    </Flex>
                  )}
                </Box>
              </Tabs.Content>

              {/* Tab Content: Photos */}
              <Tabs.Content value="photos" pt={0}>
                <Box
                  p={6}
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.100"
                  shadow="sm"
                >
                  <Heading size="md" mb={5}>
                    {t('clubs.clubImage')}
                  </Heading>
                  {club.images && club.images.length > 0 ? (
                    <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
                      {club.images.map((imgUrl, idx) => (
                        <Box
                          key={idx}
                          aspectRatio={1}
                          borderRadius="2xl"
                          overflow="hidden"
                          borderWidth="1px"
                          borderColor="gray.100"
                          _dark={{ borderColor: 'gray.700' }}
                          transition="all 0.2s"
                          _hover={{ shadow: 'lg', transform: 'scale(1.02)' }}
                          cursor="pointer"
                        >
                          <Image
                            src={imgUrl}
                            alt={`${club.name} photo ${idx + 1}`}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </Box>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      py={10}
                      color="gray.400"
                      gap={2}
                    >
                      <ImageIcon size={40} strokeWidth={1.2} />
                      <Text fontSize="sm" fontStyle="italic">
                        {t('clubs.noImages')}
                      </Text>
                    </Flex>
                  )}
                </Box>
              </Tabs.Content>
            </Box>

            {/* Sticky Sidebar - Right Column */}
            <Box>
              <VStack gap={6} align="stretch" position="sticky" top="80px">
                {/* Quick Info Card */}
                <Box
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  p={5}
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.100"
                >
                  <Heading size="sm" mb={4}>
                    {t('clubs.quickInfo')}
                  </Heading>
                  <VStack gap={4} align="stretch">
                    {/* Members */}
                    {/* <HStack gap={3}>
                      <Flex
                        w="40px"
                        h="40px"
                        borderRadius="lg"
                        bg="green.100"
                        _dark={{ bg: 'green.900' }}
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <Users
                          size={20}
                          color="var(--chakra-colors-green-600)"
                        />
                      </Flex>
                      <Box flex="1">
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          _dark={{ color: 'gray.400' }}
                          textTransform="capitalize"
                        >
                          {t('clubs.members')}
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm">
                          {club.memberCount}{' '}
                          {club.maxMembers ? `/ ${club.maxMembers}` : ''}
                        </Text>
                      </Box>
                    </HStack> */}

                    {/* Level Range */}
                    <HStack gap={3}>
                      <Flex
                        w="40px"
                        h="40px"
                        borderRadius="lg"
                        bg="green.100"
                        _dark={{ bg: 'green.900' }}
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <TrendingUp
                          size={20}
                          color="var(--chakra-colors-green-600)"
                        />
                      </Flex>
                      <Box flex="1">
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          _dark={{ color: 'gray.400' }}
                          textTransform="capitalize"
                        >
                          {t('clubs.levelRange')}
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm">
                          {getLevelRange() || t('clubs.noLevelInfo')}
                        </Text>
                      </Box>
                    </HStack>

                    {/* Venue(s) */}
                    {(() => {
                      // Collect unique venue names from schedules without detailed addresses.
                      const venueNames = club.schedules
                        ? [
                            ...new Set(
                              club.schedules
                                .map((s) =>
                                  getVenueNameFromScheduleNote(s.notes)
                                )
                                .filter(Boolean) as string[]
                            ),
                          ]
                        : [];
                      const displayVenues =
                        venueNames.length > 0
                          ? venueNames
                          : club.defaultVenue?.name
                            ? [club.defaultVenue.name]
                            : club.location
                              ? [club.location]
                              : [];
                      return (
                        <HStack gap={3} align="start">
                          <Flex
                            w="40px"
                            h="40px"
                            borderRadius="lg"
                            bg="blue.100"
                            _dark={{ bg: 'blue.900' }}
                            align="center"
                            justify="center"
                            flexShrink={0}
                          >
                            <MapPin
                              size={20}
                              color="var(--chakra-colors-blue-600)"
                            />
                          </Flex>
                          <Box flex="1">
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              _dark={{ color: 'gray.400' }}
                              textTransform="capitalize"
                            >
                              Sân Sinh Hoạt
                            </Text>
                            {displayVenues.length > 0 ? (
                              <VStack gap={0.5} align="start">
                                {displayVenues.map((v, i) => (
                                  <Text
                                    key={i}
                                    fontWeight="semibold"
                                    fontSize="sm"
                                    lineClamp={2}
                                  >
                                    {v}
                                  </Text>
                                ))}
                              </VStack>
                            ) : (
                              <Text fontWeight="semibold" fontSize="sm">
                                {t('clubs.notUpdated')}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                      );
                    })()}
                  </VStack>
                </Box>

                {/* Admin Info Card */}
                <Box
                  bg="white"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                  borderRadius="2xl"
                  p={5}
                  shadow="sm"
                  borderWidth="1px"
                  borderColor="gray.100"
                >
                  <Heading size="sm" mb={4}>
                    Trưởng nhóm
                  </Heading>
                  <HStack gap={4} align="center">
                    <Box
                      as={canShowHostDetail ? 'button' : 'div'}
                      flexShrink={0}
                      cursor={canShowHostDetail ? 'pointer' : 'default'}
                      onClick={() => {
                        if (canShowHostDetail) setIsHostDetailModalOpen(true);
                      }}
                      aria-label="Xem thông tin host"
                    >
                      <Avatar.Root size="lg">
                        {linkedHostUser?.image && (
                          <Avatar.Image
                            src={linkedHostUser.image}
                            objectFit="cover"
                          />
                        )}
                        <Avatar.Fallback>
                          {linkedHostUser
                            ? (hostRealName || linkedHostUser.name || '?')
                                .charAt(0)
                                .toUpperCase()
                            : null}
                        </Avatar.Fallback>
                      </Avatar.Root>
                    </Box>
                    <Box flex="1" minW="0">
                      <HStack gap={1.5}>
                        <Text
                          fontWeight="bold"
                          fontSize="md"
                          lineClamp={1}
                          color="orange.600"
                          cursor={canShowHostDetail ? 'pointer' : 'default'}
                          _hover={
                            canShowHostDetail
                              ? { textDecoration: 'underline' }
                              : undefined
                          }
                          onClick={() => {
                            if (canShowHostDetail)
                              setIsHostDetailModalOpen(true);
                          }}
                        >
                          {hostRealName || t('clubs.admin')}
                        </Text>
                      </HStack>
                    </Box>
                  </HStack>
                </Box>

                {/* Mini Map */}
                {(club.defaultVenue || club.location) && (
                  <Box
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="2xl"
                    p={5}
                    shadow="sm"
                    borderWidth="1px"
                    borderColor="gray.100"
                  >
                    <Heading size="sm" mb={3}>
                      {t('clubs.location')}
                    </Heading>
                    {(() => {
                      // Collect all venues: scheduleVenues first, fallback to defaultVenue
                      const venues =
                        club.scheduleVenues && club.scheduleVenues.length > 0
                          ? club.scheduleVenues
                          : club.defaultVenue
                            ? [club.defaultVenue]
                            : [];

                      if (venues.length === 0) {
                        // No venue data - show fallback search button
                        return (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(club.location || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            <Button
                              variant="outline"
                              w="full"
                              size="sm"
                              isWithinLink
                            >
                              <ExternalLink size={16} />
                              {t('clubs.searchOnGoogleMaps')}
                            </Button>
                          </a>
                        );
                      }

                      // Group districts by city for location text
                      const cityMap = new Map<string, Set<string>>();
                      for (const v of venues) {
                        const city = v.city || '';
                        const district = v.district || '';
                        if (!cityMap.has(city)) cityMap.set(city, new Set());
                        if (district) cityMap.get(city)!.add(district);
                      }

                      const locationText = Array.from(cityMap.entries())
                        .map(([city, districts]) => {
                          const dList = Array.from(districts).join(', ');
                          return city
                            ? dList
                              ? `${dList} (${city})`
                              : city
                            : dList;
                        })
                        .join(' · ');

                      const scheduleAddressLines = club.schedules
                        ? [
                            ...new Set(
                              club.schedules
                                .map((s) =>
                                  getVenueAddressLineFromScheduleNote(s.notes)
                                )
                                .filter(Boolean) as string[]
                            ),
                          ]
                        : [];
                      const venueAddressLines = venues
                        .map(getVenueAddressLine)
                        .filter(Boolean) as string[];
                      const detailedLocationLines =
                        venueAddressLines.length > 0
                          ? venueAddressLines
                          : scheduleAddressLines;

                      // Get first venue for map display
                      const firstVenue = venues[0];

                      return (
                        <>
                          {/* Location text */}
                          {detailedLocationLines.length > 0 ? (
                            <VStack gap={1} align="stretch" mb={3}>
                              {detailedLocationLines.map((line) => (
                                <Text
                                  key={line}
                                  fontSize="sm"
                                  color="gray.600"
                                  _dark={{ color: 'gray.400' }}
                                >
                                  {line}
                                </Text>
                              ))}
                            </VStack>
                          ) : (
                            <Text
                              fontSize="sm"
                              color="gray.600"
                              _dark={{ color: 'gray.400' }}
                              mb={3}
                            >
                              {locationText ||
                                club.location ||
                                t('clubs.notUpdated')}
                            </Text>
                          )}

                          {/* Map display */}
                          {firstVenue?.lat && firstVenue?.lng && (
                            <Box
                              h="200px"
                              borderRadius="xl"
                              overflow="hidden"
                              mb={3}
                            >
                              <SessionMap
                                sessions={[
                                  {
                                    id: 'club-venue',
                                    venue: firstVenue,
                                  } as ISession,
                                ]}
                              />
                            </Box>
                          )}

                          {/* Google Maps button */}
                          {firstVenue?.lat && firstVenue?.lng ? (
                            <a
                              href={getGoogleMapsUrl({
                                lat: firstVenue.lat,
                                lng: firstVenue.lng,
                                name: firstVenue.name,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                textDecoration: 'none',
                                display: 'block',
                              }}
                            >
                              <Button
                                variant="outline"
                                w="full"
                                size="sm"
                                isWithinLink
                              >
                                <ExternalLink size={16} />
                                {t('clubs.viewOnGoogleMaps')}
                              </Button>
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailedLocationLines[0] || locationText || club.location || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                textDecoration: 'none',
                                display: 'block',
                              }}
                            >
                              <Button
                                variant="outline"
                                w="full"
                                size="sm"
                                isWithinLink
                              >
                                <ExternalLink size={16} />
                                {t('clubs.searchOnGoogleMaps')}
                              </Button>
                            </a>
                          )}
                        </>
                      );
                    })()}
                  </Box>
                )}

                {/* CTA Button */}
                {isUserAdmin && (
                  <VStack gap={3} mb={4}>
                    <Button
                      colorPalette="green"
                      variant="surface"
                      size="xl"
                      w="full"
                      onClick={() =>
                        router.push(ROUTES.HOST.CLUBS.FEES(club.id))
                      }
                      borderRadius="2xl"
                      shadow="sm"
                      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <DollarSign size={20} />
                      {t('clubs.feeConfiguration')}
                    </Button>
                    <Button
                      colorPalette="green"
                      variant="surface"
                      size="xl"
                      w="full"
                      onClick={() =>
                        router.push(ROUTES.HOST.CLUBS.EDIT(club.id))
                      }
                      borderRadius="2xl"
                      shadow="sm"
                      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                      transition="all 0.2s"
                    >
                      <Settings size={20} />
                      {t('common.edit')}
                    </Button>
                  </VStack>
                )}

                {!isUserMember && !isUserAdmin && !hasPendingRequest && (
                  <Button
                    colorPalette="green"
                    size="xl"
                    w="full"
                    onClick={handleJoinClub}
                    loading={isJoining}
                    borderRadius="2xl"
                    shadow="md"
                    _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                  >
                    <UserPlus size={20} />
                    {t('clubs.joinNow')}
                  </Button>
                )}

                {!isUserMember && !isUserAdmin && hasPendingRequest && (
                  <Button
                    variant="outline"
                    colorPalette="yellow"
                    size="xl"
                    w="full"
                    disabled
                    borderRadius="2xl"
                    cursor="default"
                  >
                    {t('clubs.pendingApproval')}
                  </Button>
                )}

                <DetailViewCountFooter
                  targetType="CLUB"
                  targetId={club.id}
                  initialCount={club.viewCount}
                />

                {/* Recent Announcements */}
                {club.announcements && club.announcements.length > 0 && (
                  <Box
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderRadius="2xl"
                    p={5}
                    shadow="sm"
                    borderWidth="1px"
                    borderColor="gray.100"
                  >
                    <Flex justify="space-between" align="center" mb={3}>
                      <Heading size="sm">
                        {t('clubs.recentAnnouncements')}
                      </Heading>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setActiveTab('announcements')}
                      >
                        {t('clubs.viewAll')}
                      </Button>
                    </Flex>
                    <VStack gap={2} align="stretch">
                      {club.announcements.slice(0, 3).map((announcement) => (
                        <Box
                          key={announcement.id}
                          p={3}
                          bg="gray.50"
                          _dark={{ bg: 'gray.900' }}
                          borderRadius="lg"
                        >
                          <Text
                            fontWeight="semibold"
                            fontSize="xs"
                            mb={1}
                            lineClamp={1}
                          >
                            {announcement.title}
                          </Text>
                          <Text
                            fontSize="2xs"
                            color="gray.600"
                            _dark={{ color: 'gray.400' }}
                            lineClamp={2}
                          >
                            {announcement.content}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>
          </Grid>
        </Tabs.Root>
      </Container>

      <VModal
        isOpen={isHostDetailModalOpen}
        onClose={() => setIsHostDetailModalOpen(false)}
        title={t('session.hostInfo') || 'Thông tin Host'}
        size="md"
        hideSecondaryAction={true}
        maxBodyHeight={{
          base: 'calc(100vh - 120px)',
          md: 'calc(100vh - 112px)',
        }}
      >
        {linkedHostUser?.id && (
          <AppHostDetail
            userId={linkedHostUser.id}
            name={hostRealName || linkedHostUser.name}
            image={linkedHostUser.image || undefined}
            hideHeader={true}
            onClose={() => setIsHostDetailModalOpen(false)}
          />
        )}
      </VModal>
    </PageLayout>
  );
}
