'use client';

import { useState } from 'react';
import {
  Avatar,
  Box,
  Flex,
  Heading,
  HStack,
  Link as ChakraLink,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  MapPin,
  Settings,
  Shield,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import DetailViewCountFooter from '@/components/common/DetailViewCountFooter';
import AppHostDetail from '@/components/session/AppHostDetail';
import LevelBadgeWithDescription from '@/components/session/LevelBadgeWithDescription';
import SessionMap from '@/components/session/SessionMap';
import { Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { ROUTES } from '@/constants';
import { sortLevelsByRank } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Link, useRouter } from '@/i18n/config';
import { ISession } from '@/lib/api/types';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { EJoinRequestStatus, IClub, IClubJoinRequest } from '@/types/club';
import { ClubSocialLinks } from './ClubSocialLinks';
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
  userJoinRequest?: IClubJoinRequest | null;
  onJoin: () => void;
  onOpenPendingModal?: () => void;
  onTabChange?: (tab: string) => void;
}

interface QuickInfoVenue {
  key: string;
  name: string;
  address?: string;
  district?: string | null;
  city?: string | null;
  newAddress?: string | null;
  newDistrict?: string | null;
  newCity?: string | null;
  href?: string;
}

// Keep the location card available for a quick re-enable after the temporary hide.
const SHOW_CLUB_LOCATION_CARD = false;

export const ClubDetailSidebar = ({
  club,
  isUserAdmin,
  isUserMember,
  hasPendingRequest,
  isJoining,
  userJoinRequest,
  onJoin,
  onOpenPendingModal,
  onTabChange,
}: IClubDetailSidebarProps) => {
  const t = useTranslations();
  const router = useRouter();
  const { getLevelShortLabel } = useLevelLabel();
  const [isHostDetailModalOpen, setIsHostDetailModalOpen] = useState(false);

  const getDisplayLevels = () => {
    const requiredLevels = getClubRequiredLevels(club);
    if (requiredLevels.length > 0) return requiredLevels;

    if (!club.members || club.members.length === 0) return [];
    const levels = club.members
      .map((member) => member.user.level)
      .filter(
        (level): level is number => level !== undefined && level !== null
      );

    if (levels.length === 0) return [];
    return sortLevelsByRank(Array.from(new Set(levels)));
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
  const linkedActivityVenues =
    club.scheduleVenues && club.scheduleVenues.length > 0
      ? club.scheduleVenues
      : club.defaultVenue
        ? [club.defaultVenue]
        : [];
  const displayVenues: QuickInfoVenue[] =
    linkedActivityVenues.length > 0
      ? Array.from(
          new Map(
            linkedActivityVenues.map((venue) => [venue.id, venue] as const)
          ).values()
        ).map((venue) => ({
          key: venue.id,
          name: venue.name,
          address: venue.address,
          district: venue.district,
          city: venue.city,
          newAddress: venue.newAddress,
          newDistrict: venue.newDistrict,
          newCity: venue.newCity,
          href: ROUTES.VENUES.DETAIL(venue.id),
        }))
      : venueNames.length > 0
        ? venueNames.map((name) => ({ key: name, name }))
        : club.location
          ? [{ key: club.location, name: club.location }]
          : [];

  const displayLevels = getDisplayLevels();
  const hasQuickInfo = displayLevels.length > 0 || displayVenues.length > 0;

  return (
    <>
      <Box>
        <VStack gap={6} align="stretch" position="sticky" top="80px">
          {hasQuickInfo && (
            <Box
              bg="white"
              _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              borderRadius="2xl"
              p={{ base: 4, md: 5 }}
              boxShadow="0 8px 24px rgba(15, 23, 42, 0.06)"
              borderWidth="1px"
              borderColor="border.subtle"
            >
              <Heading size="sm" mb={4}>
                {t('clubs.quickInfo')}
              </Heading>

              <VStack gap={3} align="stretch">
                <Flex
                  gap={3}
                  align="flex-start"
                  p={3}
                  borderRadius="xl"
                  bg="green.50"
                  borderWidth="1px"
                  borderColor="green.100"
                  _dark={{ bg: 'whiteAlpha.50', borderColor: 'green.800' }}
                >
                  <Flex
                    w="32px"
                    h="32px"
                    borderRadius="lg"
                    bg="green.100"
                    color="green.600"
                    _dark={{ bg: 'green.900', color: 'green.300' }}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Shield size={16} strokeWidth={2.25} aria-hidden="true" />
                  </Flex>
                  <Box flex="1" minW={0}>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      fontWeight="medium"
                      mb={1.5}
                    >
                      {t('clubs.levelRange')}
                    </Text>
                    {displayLevels.length > 0 ? (
                      <Flex gap={1.5} wrap="wrap">
                        {displayLevels.map((level) => {
                          const levelColor = getSkillLevelColor([level]);
                          return (
                            <LevelBadgeWithDescription
                              key={level}
                              level={level}
                              colorPalette={levelColor.colorPalette}
                              variant="solid"
                              size="sm"
                              fontSize="xs"
                              fontWeight="bold"
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              borderWidth="1px"
                              borderColor={levelColor.borderColor}
                            >
                              {getLevelShortLabel(level)}
                            </LevelBadgeWithDescription>
                          );
                        })}
                      </Flex>
                    ) : (
                      <Text fontWeight="semibold" fontSize="sm">
                        {t('clubs.noLevelInfo')}
                      </Text>
                    )}
                  </Box>
                </Flex>

                <Flex
                  gap={3}
                  align="flex-start"
                  p={3}
                  borderRadius="xl"
                  bg="blue.50"
                  borderWidth="1px"
                  borderColor="blue.100"
                  _dark={{ bg: 'whiteAlpha.50', borderColor: 'blue.800' }}
                >
                  <Flex
                    w="32px"
                    h="32px"
                    borderRadius="lg"
                    bg="blue.100"
                    color="blue.600"
                    _dark={{ bg: 'blue.900', color: 'blue.300' }}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <MapPin size={16} strokeWidth={2.25} aria-hidden="true" />
                  </Flex>
                  <Box flex="1" minW={0}>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      fontWeight="medium"
                      mb={1}
                    >
                      {t('clubs.venue')}
                    </Text>
                    {displayVenues.length > 0 ? (
                      <VStack gap={1} align="stretch">
                        {displayVenues.map((venue) => {
                          const venueContent = (
                            <>
                              <Box flex="1" minW={0}>
                                <Text
                                  fontWeight="semibold"
                                  fontSize="sm"
                                  lineClamp={2}
                                  color="inherit"
                                >
                                  {venue.name}
                                </Text>
                                {(venue.address || venue.newAddress) &&
                                  venue.address !== venue.name && (
                                    <Box mt={0.5}>
                                      <AppAddressDisplay
                                        address={venue.address}
                                        district={venue.district}
                                        city={venue.city}
                                        newAddress={venue.newAddress}
                                        newDistrict={venue.newDistrict}
                                        fontSize="xs"
                                        color="fg.muted"
                                        lineClamp={2}
                                      />
                                    </Box>
                                  )}
                              </Box>
                              {venue.href && (
                                <ChevronRight
                                  size={18}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                              )}
                            </>
                          );

                          return venue.href ? (
                            <ChakraLink
                              asChild
                              key={venue.key}
                              display="flex"
                              alignItems="center"
                              gap={2}
                              w="full"
                              p={2}
                              mx={-2}
                              borderRadius="lg"
                              color="gray.800"
                              textDecoration="none"
                              transition="background-color 0.2s ease, color 0.2s ease"
                              _hover={{
                                bg: 'blue.100',
                                color: 'blue.700',
                                textDecoration: 'none',
                              }}
                              _focusVisible={{
                                outline: '2px solid',
                                outlineColor: 'blue.500',
                                outlineOffset: '2px',
                              }}
                              _dark={{
                                color: 'gray.100',
                                _hover: {
                                  bg: 'blue.900',
                                  color: 'blue.200',
                                },
                              }}
                            >
                              <Link
                                href={venue.href}
                                aria-label={`${t('venue.viewDetails')}: ${venue.name}`}
                              >
                                {venueContent}
                              </Link>
                            </ChakraLink>
                          ) : (
                            <Flex key={venue.key} align="center" gap={2} py={1}>
                              {venueContent}
                            </Flex>
                          );
                        })}
                      </VStack>
                    ) : (
                      <Text fontWeight="semibold" fontSize="sm">
                        {t('clubs.notUpdated')}
                      </Text>
                    )}
                  </Box>
                </Flex>
              </VStack>
            </Box>
          )}

          {club.socialLinks &&
            Object.values(club.socialLinks).some(
              (val) => typeof val === 'string' && val.trim() !== ''
            ) && (
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
                  {t('clubs.socialLinks.title')}
                </Heading>
                <ClubSocialLinks
                  socialLinks={club.socialLinks}
                  variant="card"
                />
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

          {SHOW_CLUB_LOCATION_CARD && (club.defaultVenue || club.location) && (
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

          {!isUserMember &&
            !isUserAdmin &&
            !hasPendingRequest &&
            userJoinRequest?.status !== EJoinRequestStatus.REJECTED && (
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
              variant="subtle"
              colorPalette="yellow"
              size="xl"
              w="full"
              borderRadius="2xl"
              onClick={onOpenPendingModal}
              _dark={{
                bg: 'yellow.900/40',
                color: 'yellow.300',
                _hover: { bg: 'yellow.900/60' },
              }}
            >
              <Clock size={20} />
              {t('clubs.pendingApproval')}
            </Button>
          )}

          {!isUserMember &&
            !isUserAdmin &&
            !hasPendingRequest &&
            userJoinRequest?.status === EJoinRequestStatus.REJECTED && (
              <Box
                p={4}
                borderRadius="2xl"
                bg="red.50"
                _dark={{ bg: 'red.900/20', borderColor: 'red.800' }}
                borderWidth="1px"
                borderColor="red.100"
              >
                <HStack gap={2} align="center" mb={1.5}>
                  <XCircle size={18} color="var(--chakra-colors-red-600)" />
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    color="red.800"
                    _dark={{ color: 'red.200' }}
                  >
                    Yêu cầu tham gia bị từ chối
                  </Text>
                </HStack>
                {userJoinRequest.response && (
                  <Text
                    fontSize="xs"
                    color="red.700"
                    _dark={{ color: 'red.300' }}
                    mb={3}
                  >
                    Lý do: {userJoinRequest.response}
                  </Text>
                )}
                <Button
                  colorPalette="green"
                  size="md"
                  w="full"
                  onClick={onJoin}
                  loading={isJoining}
                  borderRadius="xl"
                  mt={userJoinRequest.response ? 0 : 2}
                >
                  <UserPlus size={16} />
                  Gửi lại yêu cầu
                </Button>
              </Box>
            )}

          <DetailViewCountFooter
            targetType="CLUB"
            targetId={club.id}
            initialCount={club.viewCount}
          />
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
