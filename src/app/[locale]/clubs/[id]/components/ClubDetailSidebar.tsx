'use client';

import { useState } from 'react';
import {
  Avatar,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  DollarSign,
  ExternalLink,
  MapPin,
  Settings,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import DetailViewCountFooter from '@/components/common/DetailViewCountFooter';
import AppHostDetail from '@/components/session/AppHostDetail';
import SessionMap from '@/components/session/SessionMap';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { ROUTES } from '@/constants';
import { sortLevelsByRank } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useRouter } from '@/i18n/config';
import { ISession } from '@/lib/api/types';
import { IClub } from '@/types/club';
import { getGoogleMapsUrl } from '@/utils';
import {
  getClubRequiredLevels,
  getVenueAddressLine,
  getVenueAddressLineFromScheduleNote,
  getVenueNameFromScheduleNote,
} from '../club-detail.utils';

interface IClubDetailSidebarProps {
  club: IClub;
  isUserAdmin: boolean;
  isUserMember: boolean;
  hasPendingRequest: boolean;
  isJoining: boolean;
  onJoin: () => void;
  onTabChange: (tab: string) => void;
}

export const ClubDetailSidebar = ({
  club,
  isUserAdmin,
  isUserMember,
  hasPendingRequest,
  isJoining,
  onJoin,
  onTabChange,
}: IClubDetailSidebarProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { getLevelShortLabel } = useLevelLabel();
  const [isHostDetailModalOpen, setIsHostDetailModalOpen] = useState(false);

  const getLevelRange = () => {
    const requiredLevels = getClubRequiredLevels(club);
    if (requiredLevels.length > 0) {
      return requiredLevels
        .map((level) => getLevelShortLabel(level))
        .join(', ');
    }

    if (!club.members || club.members.length === 0) return null;
    const levels = club.members
      .map((member) => member.user.level)
      .filter(
        (level): level is number => level !== undefined && level !== null
      );

    if (levels.length === 0) return null;
    const uniqueLevels = sortLevelsByRank(Array.from(new Set(levels)));
    return uniqueLevels.map((level) => getLevelShortLabel(level)).join(', ');
  };

  const linkedHostUser = club.host?.id ? club.host : undefined;
  const hostRealName = club.hostName || club.host?.name;
  const canShowHostDetail = Boolean(linkedHostUser?.id);
  const venueNames = club.schedules
    ? [
        ...new Set(
          club.schedules
            .map((schedule) => getVenueNameFromScheduleNote(schedule.notes))
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

  const levelRangeText = getLevelRange();
  const hasQuickInfo = !!levelRangeText || displayVenues.length > 0;

  return (
    <>
      <Box>
        <VStack gap={6} align="stretch" position="sticky" top="80px">
          {hasQuickInfo && (
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
                      {levelRangeText || t('clubs.noLevelInfo')}
                    </Text>
                  </Box>
                </HStack>

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
                    <MapPin size={20} color="var(--chakra-colors-blue-600)" />
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
                        {displayVenues.map((venue, index) => (
                          <Text
                            key={index}
                            fontWeight="semibold"
                            fontSize="sm"
                            lineClamp={2}
                          >
                            {venue}
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
              </VStack>
            </Box>
          )}

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
                      if (canShowHostDetail) setIsHostDetailModalOpen(true);
                    }}
                  >
                    {hostRealName || t('clubs.admin')}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          </Box>

          {(club.defaultVenue || club.location) && (
            <ClubLocationCard club={club} />
          )}

          {isUserAdmin && (
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
                {t('clubs.manageThisClub')}
              </Heading>
              <Flex gap={2}>
                <Button
                  flex={1}
                  variant="outline"
                  size="sm"
                  colorPalette="green"
                  onClick={() => router.push(ROUTES.HOST.CLUBS.FEES(club.id))}
                >
                  <DollarSign size={14} />
                  {t('clubs.feeConfiguration')}
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  size="sm"
                  colorPalette="gray"
                  onClick={() => router.push(ROUTES.HOST.CLUBS.EDIT(club.id))}
                >
                  <Settings size={14} />
                  {t('common.edit')}
                </Button>
              </Flex>
            </Box>
          )}

          {!isUserMember && !isUserAdmin && !hasPendingRequest && (
            <Button
              colorPalette="green"
              size="xl"
              w="full"
              onClick={onJoin}
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
                <Heading size="sm">{t('clubs.recentAnnouncements')}</Heading>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onTabChange('announcements')}
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
    </>
  );
};

const ClubLocationCard = ({ club }: { club: IClub }) => {
  const t = useTranslations();
  const venues =
    club.scheduleVenues && club.scheduleVenues.length > 0
      ? club.scheduleVenues
      : club.defaultVenue
        ? [club.defaultVenue]
        : [];

  if (venues.length === 0) {
    return (
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
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(club.location || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <Button variant="outline" w="full" size="sm" isWithinLink>
            <ExternalLink size={16} />
            {t('clubs.searchOnGoogleMaps')}
          </Button>
        </a>
      </Box>
    );
  }

  const cityMap = new Map<string, Set<string>>();
  for (const venue of venues) {
    const city = venue.city || '';
    const district = venue.district || '';
    if (!cityMap.has(city)) cityMap.set(city, new Set());
    if (district) cityMap.get(city)!.add(district);
  }

  const locationText = Array.from(cityMap.entries())
    .map(([city, districts]) => {
      const districtList = Array.from(districts).join(', ');
      return city
        ? districtList
          ? `${districtList} (${city})`
          : city
        : districtList;
    })
    .join(' · ');
  const scheduleAddressLines = club.schedules
    ? [
        ...new Set(
          club.schedules
            .map((schedule) =>
              getVenueAddressLineFromScheduleNote(schedule.notes)
            )
            .filter(Boolean) as string[]
        ),
      ]
    : [];
  const venueAddressLines = venues
    .map(getVenueAddressLine)
    .filter(Boolean) as string[];
  const detailedLocationLines =
    venueAddressLines.length > 0 ? venueAddressLines : scheduleAddressLines;
  const firstVenue = venues[0];

  return (
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
          {locationText || club.location || t('clubs.notUpdated')}
        </Text>
      )}

      {firstVenue?.lat && firstVenue?.lng && (
        <Box h="200px" borderRadius="xl" overflow="hidden" mb={3}>
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

      <a
        href={
          firstVenue?.lat && firstVenue?.lng
            ? getGoogleMapsUrl({
                lat: firstVenue.lat,
                lng: firstVenue.lng,
                name: firstVenue.name,
              })
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                detailedLocationLines[0] || locationText || club.location || ''
              )}`
        }
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <Button variant="outline" w="full" size="sm" isWithinLink>
          <ExternalLink size={16} />
          {firstVenue?.lat && firstVenue?.lng
            ? t('clubs.viewOnGoogleMaps')
            : t('clubs.searchOnGoogleMaps')}
        </Button>
      </a>
    </Box>
  );
};
