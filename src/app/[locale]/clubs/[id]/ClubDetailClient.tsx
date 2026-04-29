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
  Separator,
  Avatar,
  Image,
  Grid,
  Tabs,
} from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { RichTextDisplay } from '@/components/ui/RichTextDisplay';
import {
  MapPin,
  Users,
  Calendar,
  Crown,
  MessageSquare,
  Settings,
  Info,
  Image as ImageIcon,
  TrendingUp,
  DollarSign,
  UserPlus,
  ExternalLink,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserRole } from '@/lib/api/types';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { ClubsService } from '@/lib/api/clubs.service';
import { IClub, EMemberRole } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { useAuthStore } from '@/stores/useAuthStore';
import PageLayout from '@/components/layout/PageLayout';
import { ROUTES } from '@/constants';
import { getGoogleMapsUrl } from '@/utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';

interface ClubDetailClientProps {
  initialClub: IClub | null;
}

export default function ClubDetailClient({
  initialClub,
}: ClubDetailClientProps) {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const { user: currentUser } = useAuthStore();
  const { getLevelLabel } = useLevelLabel();

  const [club, setClub] = useState<IClub | null>(initialClub);
  const [isLoading, setIsLoading] = useState(!initialClub);
  const [activeTab, setActiveTab] = useState('about');
  const [isJoining, setIsJoining] = useState(false);

  const loadClubDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ClubsService.getClubDetails(clubId);
      setClub(data);
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

  const getLevelRange = () => {
    // Priority 1: Use manual settings if available
    if (club?.requiredLevels && club.requiredLevels.length > 0) {
      return club.requiredLevels
        .sort((a, b) => a - b)
        .map((l) => getLevelLabel(l))
        .join(', ');
    }

    // Fallback: Calculate from members
    if (!club?.members || club.members.length === 0) return null;
    const levels = club.members
      .map((m) => m.user.level)
      .filter((l): l is number => l !== undefined && l !== null);

    if (levels.length === 0) return null;
    const min = Math.min(...levels);
    const max = Math.max(...levels);

    if (min === max) return getLevelLabel(min);
    return `${getLevelLabel(min)} - ${getLevelLabel(max)}`;
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

  const hostRealName =
    club?.hostName ||
    club?.host?.name ||
    club?.members?.find(
      (m) => String(m.user.id) === String(club.hostId || club.host?.id)
    )?.user?.name;

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
      await loadClubDetails();
    } catch (error) {
      console.error('Failed to join club:', error);
      toaster.error({ title: t('common.error') });
    } finally {
      setIsJoining(false);
    }
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

  return (
    <PageLayout title={club.name}>
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
          {club.image ? (
            <Image
              src={club.image}
              alt={club.name}
              w="full"
              h="full"
              objectFit="cover"
            />
          ) : (
            <Box
              h="full"
              bgGradient="to-r"
              gradientFrom={club.color ? `${club.color}.400` : 'green.400'}
              gradientVia="teal.400"
              gradientTo="blue.400"
            />
          )}
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
          p={{ base: 4, md: 5 }}
          borderWidth="1px"
          borderColor="gray.100"
          mb={4}
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 4, md: 6 }}
            align={{ base: 'stretch', md: 'center' }}
          >
            <Flex gap={4} align="center">
              <Avatar.Root
                size={{ base: 'lg', md: 'xl' }}
                flexShrink={0}
                shadow="sm"
              >
                <Avatar.Image src={club.image} />
                <Avatar.Fallback>
                  {club.name.charAt(0).toUpperCase()}
                </Avatar.Fallback>
              </Avatar.Root>
              <Box flex="1" minW="0">
                <Heading
                  size={{ base: 'lg', md: 'xl' }}
                  mb={0.5}
                  letterSpacing="tight"
                  lineClamp={1}
                >
                  {club.name}
                </Heading>
                <HStack
                  gap={1.5}
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                >
                  <MapPin size={16} />
                  <Text fontSize="sm" lineClamp={1}>
                    {(() => {
                      // Collect all venues: scheduleVenues first, fallback to defaultVenue
                      const venues =
                        club.scheduleVenues && club.scheduleVenues.length > 0
                          ? club.scheduleVenues
                          : club.defaultVenue
                            ? [club.defaultVenue]
                            : [];

                      if (venues.length === 0)
                        return club.location || t('clubs.notUpdated');

                      // Group districts by city
                      const cityMap = new Map<string, Set<string>>();
                      for (const v of venues) {
                        const city = v.city || '';
                        const district = v.district || '';
                        if (!cityMap.has(city)) cityMap.set(city, new Set());
                        if (district) cityMap.get(city)!.add(district);
                      }

                      return Array.from(cityMap.entries())
                        .map(([city, districts]) => {
                          const dList = Array.from(districts).join(', ');
                          return city
                            ? dList
                              ? `${dList} (${city})`
                              : city
                            : dList;
                        })
                        .join(' · ');
                    })()}
                  </Text>
                </HStack>
              </Box>
            </Flex>

            <Flex
              justify={{ base: 'stretch', md: 'flex-end' }}
              flex="1"
              gap={3}
            >
              {isUserAdmin && (
                <Button
                  colorPalette="blue"
                  variant="outline"
                  size={{ base: 'md', md: 'lg' }}
                  onClick={() => router.push(ROUTES.HOST.CLUBS.EDIT(club.id))}
                  w={{ base: 'full', md: 'auto' }}
                  borderRadius="xl"
                >
                  <Settings size={16} />
                  {t('common.edit')}
                </Button>
              )}
              {!isUserMember && !isUserAdmin && (
                <Button
                  colorPalette="green"
                  size={{ base: 'md', md: 'lg' }}
                  onClick={handleJoinClub}
                  loading={isJoining}
                  w={{ base: 'full', md: 'auto' }}
                  borderRadius="xl"
                  shadow="sm"
                  _hover={{ shadow: 'md', transform: 'translateY(-1px)' }}
                >
                  <UserPlus size={16} />
                  {t('clubs.joinNow')}
                </Button>
              )}
              {isUserMember && !isUserAdmin && (
                <Badge
                  colorPalette="green"
                  size="lg"
                  px={4}
                  py={2}
                  borderRadius="xl"
                  w={{ base: 'full', md: 'auto' }}
                  textAlign="center"
                >
                  {t('clubs.alreadyJoined')}
                </Badge>
              )}
            </Flex>
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
                  <Flex justify="space-between" align="center" mb={5}>
                    <Heading size="md">{t('clubs.clubMembers')}</Heading>
                    <Badge colorPalette="gray" size="sm">
                      {club.memberCount} {t('clubs.members')}
                    </Badge>
                  </Flex>

                  {club.members && club.members.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                      {club.members.map((member) => (
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
                          _hover={{
                            bg: 'gray.100',
                            _dark: { bg: 'gray.800' },
                            shadow: 'sm',
                          }}
                        >
                          <Avatar.Root size="lg">
                            <Avatar.Image src={member.user.image} />
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
                        </Flex>
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
                                  `clubs.dayNames.${schedule.dayOfWeek}` as any
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
                                <Avatar.Image src={announcement.author.image} />
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
                    </HStack>

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
                      // Collect unique venue names from schedules
                      const venueNames = club.schedules
                        ? [
                            ...new Set(
                              club.schedules
                                .map((s) => s.notes)
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
                    <Avatar.Root size="lg" flexShrink={0}>
                      <Avatar.Image src={club.host.image} />
                      <Avatar.Fallback>
                        {(hostRealName || club.host.name || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <Box flex="1" minW="0">
                      <HStack gap={1.5}>
                        <Crown
                          size={16}
                          color="var(--chakra-colors-orange-500)"
                        />
                        <Text
                          fontWeight="bold"
                          fontSize="md"
                          lineClamp={1}
                          color="orange.600"
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
                    {club.defaultVenue?.lat && club.defaultVenue?.lng ? (
                      <a
                        href={getGoogleMapsUrl({
                          lat: club.defaultVenue.lat,
                          lng: club.defaultVenue.lng,
                          name: club.defaultVenue.name,
                        })}
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
                          {t('clubs.viewOnGoogleMaps')}
                        </Button>
                      </a>
                    ) : (
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
                    )}
                  </Box>
                )}

                {/* CTA Button */}
                {isUserAdmin && (
                  <Button
                    colorPalette="blue"
                    variant="surface"
                    size="xl"
                    w="full"
                    onClick={() => router.push(ROUTES.HOST.CLUBS.EDIT(club.id))}
                    borderRadius="2xl"
                    shadow="sm"
                    _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                    transition="all 0.2s"
                    mb={4}
                  >
                    <Settings size={20} />
                    {t('common.edit')}
                  </Button>
                )}

                {!isUserMember && !isUserAdmin && (
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
    </PageLayout>
  );
}
