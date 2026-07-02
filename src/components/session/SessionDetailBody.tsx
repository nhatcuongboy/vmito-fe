'use client';

import { ISession } from '@/lib/api/types';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  Grid,
  Icon,
  Separator,
  Text,
  Wrap,
} from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import {
  LayoutGrid,
  Users,
  Shield,
  Info,
  Phone,
  Navigation,
  UserCheck,
  Feather,
} from 'lucide-react';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/config';
import { Locale } from '@/i18n/locales';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { sortLevelsByRank } from '@/constants/levels';
import { AppPlayerRating } from '@/components/rating';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import dayjs from '@/lib/dayjs';
import SessionParticipantList from './SessionParticipantList';
import { normalizePhoneForZalo } from '@/utils/phone-utils';
import Image from 'next/image';
import LevelBadgeWithDescription from './LevelBadgeWithDescription';
import LevelDescriptionsModal from './LevelDescriptionsModal';
import SessionReferenceVideo from './SessionReferenceVideo';
import { ROUTES } from '@/constants';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';

interface ISessionDetailBodyProps {
  session: ISession;
  maxPlayers: number;
  approvedPlayersCount: number;
  onHostClick?: () => void;
}

const SessionDetailBody = ({
  session,
  maxPlayers,
  approvedPlayersCount,
  onHostClick,
}: ISessionDetailBodyProps) => {
  const t = useTranslations('session');
  const tLevelDescriptions = useTranslations('common.levelDescriptions');
  const tVenue = useTranslations('venue');
  const locale = useLocale();
  const { getLevelShortLabel } = useLevelLabel();
  const [isLevelDescriptionsOpen, setIsLevelDescriptionsOpen] = useState(false);

  const displayHostName = session.hostName || session.host?.name || '';
  const skillLevelColor = getSkillLevelColor(session.requiredLevels);
  const isCrawled = session.isCrawled === true;

  // For crawled sessions, tapping the author opens their Facebook profile
  const handleHostClick = isCrawled
    ? session.externalAuthorUrl
      ? () =>
          window.open(
            session.externalAuthorUrl,
            '_blank',
            'noopener,noreferrer'
          )
      : undefined
    : onHostClick;

  const formatDetailDate = (dateString: string | Date): string => {
    const date = dayjs
      .utc(dateString)
      .tz('Asia/Ho_Chi_Minh')
      .locale(locale === Locale.VI ? Locale.VI : Locale.EN);
    const today = dayjs().tz('Asia/Ho_Chi_Minh').startOf('day');
    const tomorrow = today.add(1, 'day');
    const dateToCompare = date.startOf('day');

    let prefix = '';
    if (dateToCompare.isSame(today)) {
      prefix = locale === Locale.VI ? 'Hôm nay' : 'Today';
    } else if (dateToCompare.isSame(tomorrow)) {
      prefix = locale === Locale.VI ? 'Ngày mai' : 'Tomorrow';
    } else {
      const dayName = date.format('dddd');
      prefix = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    }

    const dateFormat = locale === Locale.VI ? 'DD/MM/YYYY' : 'MMM DD, YYYY';
    return `${prefix}, ${date.format(dateFormat)}`;
  };

  const timeDisplay = session.startTime
    ? formatTimeRangeByDevicePreference(
        session.startTime,
        session.endTime,
        t('inProgress')
      )
    : t('notStartedYet');

  const dateDisplay = session.startTime
    ? formatDetailDate(session.startTime)
    : t('dateNotSet');

  const venueDisplayName = session.venue?.name
    ? tVenue('nameFormat', { name: session.venue.name })
    : session.location || '';
  const venueDetailHref = session.venue?.id
    ? ROUTES.VENUES.DETAIL(session.venue.id, session.venue.slug)
    : null;

  const handleOpenMap = () => {
    const address = session.venue?.address || venueDisplayName;
    if (address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        '_blank'
      );
    }
  };

  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800' }}
      borderTopRadius="2xl"
      borderBottomRadius="2xl"
      mt="-16px"
      position="relative"
      zIndex={1}
      px={{ base: 5, md: 8 }}
      pt={4}
      pb={4}
    >
      {/* Session Name */}
      <Text
        fontSize={{ base: 'xl', md: '2xl' }}
        fontWeight="bold"
        lineHeight="tight"
      >
        {session.name}
      </Text>

      {/* Time & Date */}
      <Flex
        align="center"
        gap={2}
        mt={2}
        color="gray.600"
        _dark={{ color: 'gray.400' }}
      >
        <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="medium">
          {timeDisplay}
        </Text>
        <Text fontSize={{ base: 'md', md: 'lg' }}>|</Text>
        <Text fontSize={{ base: 'md', md: 'lg' }}>{dateDisplay}</Text>
      </Flex>

      {/* Location */}
      {venueDisplayName && (
        <Flex align="center" gap={1} mt={2}>
          {venueDetailHref ? (
            <Link href={venueDetailHref} style={{ textDecoration: 'none' }}>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color="green.600"
                _hover={{ textDecoration: 'underline' }}
              >
                {venueDisplayName}
              </Text>
            </Link>
          ) : (
            <Text fontSize="sm" fontWeight="medium" color="green.600">
              {venueDisplayName}
            </Text>
          )}
          <IconButton
            aria-label="Open map"
            variant="ghost"
            size="xs"
            colorPalette="green"
            onClick={handleOpenMap}
            icon={<Icon as={Navigation} boxSize={3.5} />}
          />
        </Flex>
      )}
      {session.venue?.address &&
        session.venue.address !== session.venue?.name && (
          <Box mt={0.5}>
            <AppAddressDisplay
              address={session.venue.address}
              district={session.venue.district}
              newAddress={session.venue.newAddress}
              newDistrict={session.venue.newDistrict}
              lineClamp={2}
            />
          </Box>
        )}

      <Separator mt={3} mb={1} />

      {/* Host Section */}
      <Flex
        align="center"
        gap={4}
        cursor={handleHostClick ? 'pointer' : 'default'}
        onClick={handleHostClick}
        _hover={
          handleHostClick ? { bg: 'gray.50', _dark: { bg: 'gray.700' } } : {}
        }
        borderRadius="xl"
        py={1.5}
        px={2.5}
        mx={-2.5}
        transition="background 0.2s"
      >
        <Avatar.Root
          size="lg"
          bg="brand.500"
          borderWidth="2px"
          borderColor="white"
          boxShadow="0 0 0 1px {colors.gray.200}"
          _dark={{ boxShadow: '0 0 0 1px {colors.gray.700}' }}
        >
          <Avatar.Fallback name={displayHostName}>
            {displayHostName ? displayHostName.charAt(0).toUpperCase() : ''}
          </Avatar.Fallback>
          {(isCrawled ? session.externalAuthorAvatar : session.host?.image) && (
            <Avatar.Image
              src={
                (isCrawled
                  ? session.externalAuthorAvatar
                  : session.host?.image) || undefined
              }
            />
          )}
        </Avatar.Root>
        <Box flex={1}>
          <Flex align="center" gap={2}>
            <Text fontWeight="bold" fontSize="lg">
              {displayHostName}
            </Text>
            {!isCrawled && (
              <AppPlayerRating userId={session.hostId} showBullet />
            )}
          </Flex>
          {isCrawled ? (
            <Text fontSize="xs" color="gray.500" fontStyle="italic" mt={0.5}>
              Đăng trên Facebook •{' '}
              {session.externalGroupUrl ? (
                <Box
                  as="span"
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    window.open(
                      session.externalGroupUrl,
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                >
                  {session.externalSource || t('crawledSourcePrefix')}
                </Box>
              ) : (
                <Box as="span">
                  {session.externalSource || t('crawledSourcePrefix')}
                </Box>
              )}
            </Text>
          ) : (
            <Text fontSize="xs" color="gray.500">
              {t('host')}
            </Text>
          )}
        </Box>
        <Flex gap={2}>
          {!isCrawled && session.hostPhone && session.allowZaloContact && (
            <IconButton
              aria-label="Zalo host"
              size="sm"
              colorPalette="green"
              variant="subtle"
              borderRadius="full"
              borderWidth="1px"
              borderColor="green.200"
              _dark={{ borderColor: 'green.800' }}
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `https://zalo.me/${normalizePhoneForZalo(session.hostPhone)}`,
                  '_blank'
                );
              }}
              icon={
                <Image
                  src="/icons/zalo.png"
                  alt="Zalo"
                  width={20}
                  height={20}
                />
              }
            />
          )}
          {!isCrawled && session.hostPhone && (
            <IconButton
              aria-label="Call host"
              size="sm"
              colorPalette="green"
              variant="subtle"
              borderRadius="full"
              borderWidth="1px"
              borderColor="green.200"
              _dark={{ borderColor: 'green.800' }}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `tel:${session.hostPhone}`;
              }}
              icon={<Icon as={Phone} boxSize={4} />}
            />
          )}
        </Flex>
      </Flex>

      {/* Description / Note */}
      {session.description && (
        <Box mt={6} mb={4}>
          <Text
            fontWeight="bold"
            fontSize="lg"
            mb={3}
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon as={Info} color="green.500" boxSize={5} />
            {t('description') || 'Mô tả chi tiết'}
          </Text>
          <Box
            bg="green.50"
            _dark={{ bg: 'whiteAlpha.100' }}
            borderRadius="xl"
            borderLeftWidth="4px"
            borderLeftColor="green.500"
            p={{ base: 4, md: 5 }}
            boxShadow="sm"
          >
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="gray.800"
              _dark={{ color: 'gray.100' }}
              whiteSpace="pre-wrap"
              lineHeight="relaxed"
            >
              {session.description}
            </Text>
          </Box>
        </Box>
      )}

      {/* Participants Section — crawled sessions have no managed players */}
      {!isCrawled && (
        <>
          <Separator my={4} />
          <SessionParticipantList
            players={session.players}
            approvedPlayersCount={approvedPlayersCount}
            maxPlayers={maxPlayers}
            session={session}
          />
        </>
      )}

      {/* Session Details Grid, Skill Levels, Fee — hidden on desktop (shown in sidebar) */}
      <Box display={{ base: 'block', md: 'none' }}>
        {/* Session Details Grid */}
        <Separator my={4} />
        <Grid templateColumns="1fr 1fr" gap={3}>
          {/* Courts / Max Players / Current Players — hidden for crawled */}
          {!isCrawled && (
            <Flex align="center" gap={2}>
              <Icon as={LayoutGrid} boxSize={5} color="green.500" />
              <Text fontSize="sm">
                {session.numberOfCourts} {t('courtsAvailable')}
                {session.courts && session.courts.length > 0 && (
                  <Text as="span" color="gray.500" ml={1}>
                    (
                    {session.courts
                      .slice()
                      .sort((a, b) => a.courtNumber - b.courtNumber)
                      .map((court) => court.courtNumber)
                      .join(', ')}
                    )
                  </Text>
                )}
              </Text>
            </Flex>
          )}

          {!isCrawled && (
            <Flex align="center" gap={2}>
              <Icon as={Users} boxSize={5} color="green.500" />
              <Text fontSize="sm">
                {t('maxPlayers', { count: maxPlayers })}
              </Text>
            </Flex>
          )}

          {!isCrawled && (
            <Flex align="center" gap={2}>
              <Icon as={UserCheck} boxSize={5} color="green.500" />
              <Text fontSize="sm">
                {approvedPlayersCount}/{maxPlayers} {t('players')}
              </Text>
            </Flex>
          )}

          {/* Shuttlecock */}
          {session.shuttlecock && (
            <Flex align="center" gap={2}>
              <Icon as={Feather} boxSize={5} color="green.500" />
              <Text fontSize="sm">
                {t('shuttlecock') + ' ' + session.shuttlecock}
              </Text>
            </Flex>
          )}
        </Grid>

        {/* Skill Levels */}
        <Flex align="center" gap={3} mt={3}>
          <Icon as={Shield} boxSize={5} color={skillLevelColor.color} />
          <Wrap gap={1}>
            {session.requiredLevels && session.requiredLevels.length > 0 ? (
              sortLevelsByRank(Array.from(new Set(session.requiredLevels))).map(
                (level) => {
                  const levelColor = getSkillLevelColor([level]);
                  return (
                    <LevelBadgeWithDescription
                      key={level}
                      level={level}
                      colorPalette={levelColor.colorPalette}
                      variant="solid"
                      size="md"
                      fontSize="xs"
                      fontWeight="bold"
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                      borderWidth="1px"
                      borderColor={levelColor.borderColor}
                    >
                      {getLevelShortLabel(level)}
                    </LevelBadgeWithDescription>
                  );
                }
              )
            ) : (
              <Badge
                colorPalette="gray"
                variant="subtle"
                size="md"
                fontSize="xs"
                fontWeight="bold"
                px={2.5}
                py={0.5}
                borderRadius="full"
                borderWidth="1px"
                borderColor="gray.200"
              >
                {t('allLevels')}
              </Badge>
            )}
          </Wrap>
          <IconButton
            aria-label={tLevelDescriptions('open')}
            type="button"
            size="xs"
            variant="ghost"
            colorPalette="green"
            color="green.500"
            bg="green.50"
            _hover={{
              color: 'green.600',
              bg: 'green.100',
              transform: 'scale(1.1)',
            }}
            _active={{ transform: 'scale(0.95)' }}
            flexShrink={0}
            minW="20px"
            h="20px"
            borderRadius="full"
            transition="all 0.2s"
            icon={<Info size={12} />}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsLevelDescriptionsOpen(true);
            }}
          />
        </Flex>
      </Box>

      {session.referenceVideoUrl && (
        <Box>
          <Separator my={4} />
          <SessionReferenceVideo url={session.referenceVideoUrl} />
        </Box>
      )}

      <LevelDescriptionsModal
        isOpen={isLevelDescriptionsOpen}
        onClose={() => setIsLevelDescriptionsOpen(false)}
      />
    </Box>
  );
};

export default SessionDetailBody;
