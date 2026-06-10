'use client';

import { ISession, FeeType, SessionStatus, UserRole } from '@/lib/api/types';
import {
  Badge,
  Box,
  Flex,
  Icon,
  Separator,
  Text,
  Wrap,
} from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import {
  Banknote,
  Calendar,
  Clock,
  ClipboardList,
  Feather,
  Info,
  LayoutGrid,
  LogIn,
  MapPin,
  Navigation,
  Settings,
  Shield,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Locale } from '@/i18n/locales';
import { FeeService } from '@/lib/api/fee.service';
import FeeDetailPopover from '@/components/fee/FeeDetailPopover';
import { useSidebar } from '@/contexts/SidebarContext';
import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '@/constants';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import dayjs from '@/lib/dayjs';
import LevelBadgeWithDescription from './LevelBadgeWithDescription';
import LevelDescriptionsModal from './LevelDescriptionsModal';
import { formatTimeRangeByDevicePreference } from '@/utils/time-helpers';

interface ISessionDetailStickyBarProps {
  session: ISession;
  isFull: boolean;
  userRegistrationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  isRegistrationLoading: boolean;
  isOwner: boolean;
  onRegister: () => void;
  onViewRegistration: () => void;
  displayMode?: 'mobile' | 'sidebar';
  maxPlayers?: number;
  approvedPlayersCount?: number;
}

const SessionDetailStickyBar = ({
  session,
  isFull,
  userRegistrationStatus,
  isRegistrationLoading,
  isOwner,
  onRegister,
  onViewRegistration,
  displayMode = 'mobile',
  maxPlayers = 0,
  approvedPlayersCount = 0,
}: ISessionDetailStickyBarProps) => {
  const t = useTranslations('session');
  const tLevelDescriptions = useTranslations('common.levelDescriptions');
  const tVenue = useTranslations('venue');
  const locale = useLocale();
  const { getLevelShortLabel } = useLevelLabel();
  const { isCollapsed } = useSidebar();
  const { user } = useAuthStore();
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;
  const skillLevelColor = getSkillLevelColor(session.requiredLevels);
  const [isLevelDescriptionsOpen, setIsLevelDescriptionsOpen] = useState(false);
  const isPastEndTime = session.endTime
    ? new Date(session.endTime) < new Date()
    : false;
  const isClosed =
    session.status === SessionStatus.FINISHED ||
    session.status === SessionStatus.CANCELLED ||
    isPastEndTime;

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

  const handleOpenMap = () => {
    const address = session.venue?.address || venueDisplayName;
    if (address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        '_blank'
      );
    }
  };

  const renderActionButton = () => {
    const buttonSize = displayMode === 'sidebar' ? 'lg' : 'md';
    const buttonRadius = displayMode === 'sidebar' ? 'xl' : 'lg';
    const buttonW = displayMode === 'sidebar' ? 'full' : undefined;

    const manageHref =
      user?.role === UserRole.PLAYER
        ? `/player/sessions/${session.slug || session.id}`
        : `/host/sessions/${session.slug || session.id}`;

    if (canManage && isClosed) {
      return (
        <NextLinkButton
          href={manageHref}
          colorPalette="gray"
          variant="subtle"
          size={buttonSize}
          w={buttonW}
          fontWeight="semibold"
          borderRadius={buttonRadius}
        >
          <Icon as={ClipboardList} boxSize={4} />
          {t('viewEndedSession')}
        </NextLinkButton>
      );
    }

    if (canManage) {
      return (
        <NextLinkButton
          href={manageHref}
          colorPalette="green"
          variant="solid"
          size={buttonSize}
          w={buttonW}
          fontWeight="semibold"
          borderRadius={buttonRadius}
        >
          <Icon as={Settings} boxSize={4} />
          {t('manageSession')}
        </NextLinkButton>
      );
    }

    if (isClosed) {
      return (
        <Button
          colorPalette="gray"
          variant="subtle"
          size={buttonSize}
          w={buttonW}
          fontWeight="semibold"
          borderRadius={buttonRadius}
          disabled
        >
          <Icon as={ClipboardList} boxSize={4} />
          {t('sessionEnded')}
        </Button>
      );
    }

    if (userRegistrationStatus === 'APPROVED') {
      const viewHref = `/player/sessions/${session.slug || session.id}`;
      return (
        <NextLinkButton
          href={viewHref}
          colorPalette="green"
          variant="solid"
          size={buttonSize}
          w={buttonW}
          fontWeight="semibold"
          borderRadius={buttonRadius}
          loading={isRegistrationLoading}
        >
          <Icon as={LogIn} boxSize={4} />
          {t('viewSession')}
        </NextLinkButton>
      );
    }

    if (
      userRegistrationStatus === 'PENDING' ||
      userRegistrationStatus === 'REJECTED'
    ) {
      return (
        <Button
          colorPalette="green"
          variant="subtle"
          size={buttonSize}
          w={buttonW}
          fontWeight="semibold"
          borderRadius={buttonRadius}
          loading={isRegistrationLoading}
          onClick={onViewRegistration}
        >
          <Icon as={ClipboardList} boxSize={4} />
          {t('viewMyRegistration')}
        </Button>
      );
    }

    // Default: Register button
    return (
      <Button
        colorPalette="green"
        variant="solid"
        size={buttonSize}
        w={buttonW}
        fontWeight="semibold"
        borderRadius={buttonRadius}
        loading={isRegistrationLoading}
        disabled={isFull}
        onClick={onRegister}
      >
        <Icon as={UserPlus} boxSize={4} />
        {isFull ? t('sessionFull') : t('registerNow')}
      </Button>
    );
  };

  // Desktop sidebar card variant
  if (displayMode === 'sidebar') {
    return (
      <>
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
          boxShadow="md"
          overflow="hidden"
        >
          {/* Fee header */}
          {session.feeConfig && (
            <Box
              px={5}
              py={4}
              borderBottomWidth="1px"
              borderBottomColor={{ base: 'gray.100', _dark: 'gray.700' }}
              bg={{ base: 'green.50', _dark: 'gray.750' }}
            >
              <Flex align="center" gap={2}>
                <Icon as={Banknote} boxSize={5} color="red.600" />
                <Text fontSize="2xl" fontWeight="bold" color="red.600">
                  {FeeService.getFeeDisplayText(session.feeConfig)}
                </Text>
                {session.feeConfig.feeType === FeeType.FIXED && (
                  <Text fontSize="sm" color="gray.500" fontWeight="normal">
                    /slot
                  </Text>
                )}
                <FeeDetailPopover feeConfig={session.feeConfig} />
              </Flex>
            </Box>
          )}

          {/* Info rows */}
          <Box px={5} py={4}>
            <Flex direction="column" gap={3.5}>
              {/* Time */}
              <Flex align="center" gap={3}>
                <Icon as={Clock} boxSize={4} color="gray.400" flexShrink={0} />
                <Text fontSize="sm" fontWeight="medium">
                  {timeDisplay}
                </Text>
              </Flex>

              {/* Date */}
              <Flex align="center" gap={3}>
                <Icon
                  as={Calendar}
                  boxSize={4}
                  color="gray.400"
                  flexShrink={0}
                />
                <Text fontSize="sm">{dateDisplay}</Text>
              </Flex>

              {/* Location */}
              {venueDisplayName && (
                <Flex
                  align="flex-start"
                  gap={3}
                  cursor="pointer"
                  onClick={handleOpenMap}
                  _hover={{ color: 'green.600' }}
                  transition="color 0.15s"
                  role="button"
                >
                  <Icon
                    as={MapPin}
                    boxSize={4}
                    color="gray.400"
                    flexShrink={0}
                    mt="1px"
                  />
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="green.600">
                      {venueDisplayName}
                    </Text>
                    {session.venue?.address &&
                      session.venue.address !== session.venue?.name && (
                        <Text fontSize="xs" color="gray.500" mt={0.5}>
                          {session.venue.address}
                        </Text>
                      )}
                  </Box>
                  <Icon
                    as={Navigation}
                    boxSize={3.5}
                    color="green.400"
                    flexShrink={0}
                    mt="2px"
                  />
                </Flex>
              )}

              <Separator />

              {/* Courts */}
              <Flex align="center" gap={3}>
                <Icon
                  as={LayoutGrid}
                  boxSize={4}
                  color="green.500"
                  flexShrink={0}
                />
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

              {/* Players */}
              <Flex align="center" gap={3}>
                <Icon
                  as={UserCheck}
                  boxSize={4}
                  color="green.500"
                  flexShrink={0}
                />
                <Text fontSize="sm">
                  {approvedPlayersCount}/{maxPlayers} {t('players')}
                </Text>
              </Flex>

              {/* Shuttlecock */}
              {session.shuttlecock && (
                <Flex align="center" gap={3}>
                  <Icon
                    as={Feather}
                    boxSize={4}
                    color="green.500"
                    flexShrink={0}
                  />
                  <Text fontSize="sm">
                    {t('shuttlecock') + ' ' + session.shuttlecock}
                  </Text>
                </Flex>
              )}

              {/* Skill Levels */}
              <Flex align="flex-start" gap={3}>
                <Icon
                  as={Shield}
                  boxSize={4}
                  color={skillLevelColor.color}
                  flexShrink={0}
                  mt="2px"
                />
                <Wrap gap={1}>
                  {session.requiredLevels &&
                  session.requiredLevels.length > 0 ? (
                    Array.from(new Set(session.requiredLevels))
                      .sort((a, b) => a - b)
                      .map((level) => {
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
                      })
                  ) : (
                    <Badge
                      colorPalette="gray"
                      variant="subtle"
                      size="sm"
                      fontSize="xs"
                      fontWeight="bold"
                      px={2}
                      py={0.5}
                      borderRadius="full"
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
            </Flex>

            <Separator mt={4} mb={4} />

            {/* CTA Button */}
            {renderActionButton()}
          </Box>
        </Box>
        <LevelDescriptionsModal
          isOpen={isLevelDescriptionsOpen}
          onClose={() => setIsLevelDescriptionsOpen(false)}
        />
      </>
    );
  }

  // Mobile sticky bar (default)
  return (
    <>
      <Box
        position="fixed"
        display={{ base: 'block', md: 'none' }}
        left={{
          base: 0,
          md: isCollapsed
            ? `${SIDEBAR_WIDTH_COLLAPSED}px`
            : `${SIDEBAR_WIDTH_EXPANDED}px`,
        }}
        right={0}
        bottom={0}
        zIndex={100}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        borderTopWidth="1px"
        borderTopColor={{ base: 'gray.200', _dark: 'gray.700' }}
        boxShadow="0 -2px 10px rgba(0, 0, 0, 0.08)"
        px={5}
        py={3}
        paddingBottom="calc(12px + env(safe-area-inset-bottom))"
        transition="left 0.3s ease"
      >
        <Flex align="center" gap={4} maxW="800px" mx="auto">
          {/* Price Section */}
          {session.feeConfig && (
            <Box flexShrink={0}>
              <Flex align="center" gap={1}>
                <Icon as={Banknote} boxSize={5} color="red.600" />
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="red.600"
                  whiteSpace="nowrap"
                >
                  {FeeService.getFeeDisplayText(session.feeConfig)}
                </Text>
                {session.feeConfig.feeType === FeeType.FIXED && (
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    fontWeight="normal"
                    whiteSpace="nowrap"
                  >
                    /slot
                  </Text>
                )}
                <FeeDetailPopover feeConfig={session.feeConfig} />
              </Flex>
            </Box>
          )}

          {/* Action Button */}
          <Box ml="auto">{renderActionButton()}</Box>
        </Flex>
      </Box>
      <LevelDescriptionsModal
        isOpen={isLevelDescriptionsOpen}
        onClose={() => setIsLevelDescriptionsOpen(false)}
      />
    </>
  );
};

export default SessionDetailStickyBar;
