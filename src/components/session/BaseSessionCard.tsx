'use client';

import { ISession, UserRole } from '@/lib/api/types';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import dayjs from '@/lib/dayjs';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Icon,
  Image,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import {
  Calendar,
  Clock,
  SquareAsterisk,
  Users,
  Shield,
  Star,
  Banknote,
  Phone,
  Share2,
  Download,
  User,
} from 'lucide-react';
import { FeeService } from '@/lib/api/fee.service';
import { FeeType } from '@/lib/api/types';
import { useLocale, useTranslations } from 'next-intl';
import { Locale } from '@/i18n/locales';
import FeeDetailPopover from '@/components/fee/FeeDetailPopover';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useRatingStats } from '@/contexts/RatingStatsContext';
import { useAuthStore } from '@/stores/useAuthStore';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import { toaster } from '@/components/ui/toaster';
import { SessionActionConfig } from './BaseSessionCard.types';

// Helper functions for formatting with locale support
export const formatDate = (
  dateString: string | Date,
  locale: string
): string => {
  const date = dayjs(dateString).locale(
    locale === Locale.VI ? Locale.VI : Locale.EN
  );

  let formattedDate: string;

  if (locale === Locale.VI) {
    formattedDate = date.format('dddd, DD MMMM, YYYY');
  } else {
    formattedDate = date.format('ddd, MMM DD, YYYY');
  }

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

export const formatTime = (
  dateString: string | Date,
  locale: string
): string => {
  const date = dayjs(dateString).locale(
    locale === Locale.VI ? Locale.VI : Locale.EN
  );
  return date.format('HH:mm');
};

export const statusColors: Record<string, string> = {
  PREPARING: 'blue',
  IN_PROGRESS: 'green',
  FINISHED: 'gray',
};

export const getStatusLabel = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'PREPARING':
      return t('status.preparing');
    case 'IN_PROGRESS':
      return t('status.inProgress');
    case 'FINISHED':
      return t('status.finished');
    default:
      return status;
  }
};

interface BaseSessionCardProps {
  session: ISession;

  // Customization slots
  statusBadgeContent?: React.ReactNode;
  registrationBadgeContent?: React.ReactNode;
  afterStatusContent?: React.ReactNode;
  extraInfoRows?: React.ReactNode;
  actionButtons?: React.ReactNode;

  // Optional modal
  modalContent?: React.ReactNode;

  // NEW: Action configuration (recommended)
  actions?: SessionActionConfig;

  // DEPRECATED: Action slots (backward compatible)
  topActionButtons?: React.ReactNode;
  bottomActionButtons?: React.ReactNode;

  // Callback for when host info is clicked
  onHostClick?: (e: React.MouseEvent) => void;
}

const BaseSessionCard = ({
  session,
  statusBadgeContent,
  registrationBadgeContent,
  afterStatusContent,
  extraInfoRows,
  actionButtons,
  modalContent,
  hostActions,
  actions,
  topActionButtons,
  bottomActionButtons,
  onHostClick,
}: BaseSessionCardProps & { hostActions?: React.ReactNode }) => {
  const t = useTranslations('session');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();
  const { user } = useAuthStore();
  const { getRatingStats } = useRatingStats();
  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();

  // Compute derived state for action rendering
  const isOwner = user?.id === session.hostId;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const totalPlayers = session._count?.players || 0;
  const isFull = totalPlayers >= maxPlayers;

  // Helper function: Handle share action
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: session.name,
      text: `${t('checkOutThisSession')}: ${session.name}`,
      url: `${window.location.origin}/sessions/${session.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toaster.success({
          title: t('linkCopied'),
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Helper function: Handle call action
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.hostPhone) {
      window.location.href = `tel:${session.hostPhone}`;
    }
  };

  // Helper function: Handle download action
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadSessionImage(session, `session-share-card-portrait-${session.id}`);
  };

  // Render top action buttons (icon buttons)
  const renderTopActions = () => {
    if (!actions) return null;

    const buttons: React.ReactNode[] = [];

    // Call button (conditional on hostPhone)
    if (actions.showCallButton && session.hostPhone) {
      buttons.push(
        <IconButton
          key="call"
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Call host"
          onClick={handleCall}
          icon={<Icon as={Phone} />}
        />
      );
    }

    // Download button (owner or admin)
    if (actions.showDownloadButton && canManage) {
      buttons.push(
        <IconButton
          key="download"
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Download session image"
          loading={isDownloading}
          onClick={handleDownload}
          icon={<Icon as={Download} />}
        />
      );
    }

    // Share button (always available)
    if (actions.showShareButton) {
      buttons.push(
        <IconButton
          key="share"
          size="sm"
          colorPalette="gray"
          variant="outline"
          aria-label="Share session"
          onClick={handleShare}
          icon={<Icon as={Share2} />}
        />
      );
    }

    return buttons.length > 0 ? <>{buttons}</> : null;
  };

  // Cache rendered top actions to avoid multiple calls
  const topActionsRendered = actions ? renderTopActions() : null;
  const oldTopActions =
    topActionButtons || (actionButtons && !bottomActionButtons);

  // Render bottom action buttons (full-width buttons)
  const renderBottomActions = () => {
    if (!actions) return null;

    const leftButtons: React.ReactNode[] = [];
    const rightButtons: React.ReactNode[] = [];

    // Left side: Delete button (owner or admin)
    if (actions.showDeleteButton && canManage && actions.onDelete) {
      leftButtons.push(
        <Button
          key="delete"
          colorPalette="red"
          variant="outline"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            actions.onDelete?.(session.id);
          }}
        >
          {t('deleteSession')}
        </Button>
      );
    }

    // Right side: View button
    if (actions.showViewButton) {
      const viewHref = actions.viewButtonHref || `/sessions/${session.id}`;
      rightButtons.push(
        <NextLinkButton
          key="view"
          href={viewHref}
          colorPalette="gray"
          variant="outline"
          size="sm"
        >
          {t('view')}
        </NextLinkButton>
      );
    }

    // Right side: View Registration button (modal trigger)
    if (actions.showViewRegistrationButton && actions.onViewRegistration) {
      rightButtons.push(
        <Button
          key="view-registration"
          colorPalette="blue"
          variant="outline"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            actions.onViewRegistration?.();
          }}
        >
          {t('viewMyRegistration')}
        </Button>
      );
    }

    // Right side: View Session button (for approved players)
    if (actions.showViewSessionButton) {
      const viewSessionHref =
        actions.viewSessionHref || `/player/sessions/${session.id}`;
      rightButtons.push(
        <NextLinkButton
          key="view-session"
          href={viewSessionHref}
          colorPalette="green"
          size="sm"
        >
          {t('viewSession')}
        </NextLinkButton>
      );
    }

    // Right side: Manage button (for owners or admin)
    if (actions.showManageButton && canManage) {
      const manageHref =
        actions.manageButtonHref ||
        (user?.role === UserRole.PLAYER
          ? `/player/sessions/${session.id}`
          : `/host/sessions/${session.id}`);
      rightButtons.push(
        <NextLinkButton
          key="manage"
          href={manageHref}
          colorPalette="blue"
          size="sm"
        >
          {t('manageSession')}
        </NextLinkButton>
      );
    }

    // Right side: Register button (for non-registered users)
    if (actions.showRegisterButton && actions.onRegister) {
      rightButtons.push(
        <Button
          key="register"
          colorPalette="blue"
          size="sm"
          disabled={actions.registerButtonDisabled || isFull}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            actions.onRegister?.();
          }}
        >
          {isFull ? t('sessionFull') : t('register')}
        </Button>
      );
    }

    // Render layout if we have any buttons
    if (leftButtons.length > 0 || rightButtons.length > 0) {
      return (
        <Flex w="full" justify="space-between" align="center">
          <Box>{leftButtons}</Box>
          <Flex gap={2}>{rightButtons}</Flex>
        </Flex>
      );
    }

    return null;
  };

  // Get rating stats from context (batch loaded)
  const hostRatingStats = session.hostId
    ? getRatingStats(session.hostId)
    : null;

  const displayHostName = session.hostName || session.host?.name || '';

  const convertedSession = {
    id: session.id,
    title: session.name,
    date: session.startTime
      ? formatDate(session.startTime, locale)
      : formatDate(session.createdAt, locale) + ` (${t('notStarted')})`,
    time: session.startTime
      ? `${formatTime(session.startTime, locale)} - ${
          session.endTime
            ? formatTime(session.endTime, locale)
            : t('inProgress')
        }`
      : t('notStartedYet'),
    numberOfCourts: session.numberOfCourts,
    totalPlayers: session._count?.players || 0,
    maxPlayers,
    status: session.status,
    hostName: displayHostName,
  };

  const skillLevelColor = getSkillLevelColor(session.requiredLevels);

  // Format date and time for compact display
  const formatCompactDate = (dateString: string | Date): string => {
    const date = dayjs(dateString).locale(
      locale === Locale.VI ? Locale.VI : Locale.EN
    );
    const formattedDate =
      locale === Locale.VI
        ? date.format('dddd, DD/MM')
        : date.format('ddd, MM/DD');
    return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  };

  const compactDate = session.startTime
    ? formatCompactDate(session.startTime)
    : formatCompactDate(session.createdAt);

  const compactTime = session.startTime
    ? `${formatTime(session.startTime, locale)} - ${session.endTime ? formatTime(session.endTime, locale) : ''}`
    : '';

  // Calculate level segments for the side strip
  const getLevelSegments = () => {
    if (!session.requiredLevels || session.requiredLevels.length === 0) {
      return ['gray.300']; // Light gray for all levels
    }

    // Check if all levels (1-7) are present
    const allLevels = [1, 2, 3, 4, 5, 6, 7];
    const hasAllLevels = allLevels.every((level) =>
      session.requiredLevels!.includes(level)
    );

    if (hasAllLevels) {
      return ['gray.300']; // Keep gray for all levels
    }

    // For multiple levels, show only the highest level color
    const highestLevel = Math.max(...session.requiredLevels);
    const highestLevelColor = getSkillLevelColor([highestLevel]).color;
    return [highestLevelColor];
  };

  const levelSegments = getLevelSegments();

  return (
    <>
      <Box
        position="relative"
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        transition="transform 0.2s, box-shadow 0.2s"
        _hover={{
          transform: 'translateY(-4px)',
          boxShadow: 'xl',
        }}
        maxW="400px"
        w="100%"
        display="flex"
        flexDirection="column"
        height="100%"
      >
        {/* Level Color Strip */}
        <Flex
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          w="6px"
          direction="column"
          zIndex={2}
          opacity={0.9}
        >
          {levelSegments.map((color, index) => (
            <Box key={index} flex={1} bg={color} />
          ))}
        </Flex>

        {/* Cover Image Section */}
        <Box position="relative" h="180px" overflow="hidden">
          <Image
            src={session.coverPhoto || DEFAULT_COVER_PHOTO}
            alt={session.name}
            w="100%"
            h="100%"
            objectFit="cover"
          />
          {/* Status Badge Overlay */}
          <Box position="absolute" top={3} right={3}>
            {statusBadgeContent || (
              <Badge
                colorPalette={statusColors[convertedSession.status] || 'gray'}
                fontSize="sm"
                px={3}
                py={1}
                borderRadius="md"
              >
                {getStatusLabel(convertedSession.status, t)}
              </Badge>
            )}
          </Box>
          {/* Registration Status Overlay */}
          {registrationBadgeContent && (
            <Box position="absolute" top={3} left={3}>
              {registrationBadgeContent}
            </Box>
          )}
        </Box>

        {/* Content Section */}
        <Box p={5} pb={2} flex="1" display="flex" flexDirection="column">
          <Stack gap={4} flex="1">
            {/* Title */}
            <Heading size="lg" fontWeight="bold">
              {convertedSession.title}
            </Heading>

            {/* Host Info with Avatar and Rating */}
            <Flex
              align="center"
              gap={3}
              onClick={(e) => {
                if (onHostClick) {
                  e.stopPropagation();
                  onHostClick(e);
                }
              }}
              cursor={onHostClick ? 'pointer' : 'default'}
              _hover={onHostClick ? { opacity: 0.8 } : {}}
              transition="opacity 0.2s"
            >
              <Avatar.Root size="sm" bg="blue.500">
                <Avatar.Fallback name={displayHostName}>
                  {displayHostName
                    ? displayHostName.charAt(0).toUpperCase()
                    : ''}
                </Avatar.Fallback>
                {session.host?.image && (
                  <Avatar.Image src={session.host.image} />
                )}
              </Avatar.Root>
              <Text
                fontSize="sm"
                fontWeight="medium"
                textDecoration={onHostClick ? 'underline' : 'none'}
              >
                {displayHostName}
              </Text>
              {hostRatingStats && hostRatingStats.totalRatings > 0 && (
                <Flex align="center" gap={1}>
                  <Text fontSize="sm" color="gray.500">
                    •
                  </Text>
                  <Icon
                    as={Star}
                    boxSize={4}
                    color="yellow.500"
                    fill="yellow.500"
                  />
                  <Text fontSize="sm" fontWeight="semibold">
                    {hostRatingStats.averageRating.toFixed(1)}
                  </Text>
                </Flex>
              )}
              {hostActions}
            </Flex>

            {afterStatusContent}

            {/* Location */}
            {extraInfoRows && <Box>{extraInfoRows}</Box>}

            {/* Date & Time + Courts & Players Grid */}
            <Grid templateColumns="1fr 1fr" gap={4}>
              {/* Left Column: Date & Time */}
              <Stack gap={2}>
                <Flex align="center" gap={2}>
                  <Icon as={Calendar} boxSize={5} color="blue.500" />
                  <Text fontSize="sm">{compactDate}</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={Clock} boxSize={5} color="blue.500" />
                  <Text fontSize="sm">{compactTime}</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={SquareAsterisk} boxSize={5} color="blue.500" />
                  <Text fontSize="sm">
                    {t('shuttlecock') + ' ' + (session.shuttlecock || '...')}
                  </Text>
                </Flex>
              </Stack>

              {/* Right Column: Courts & Players */}
              <Stack gap={2}>
                <Flex align="center" gap={2}>
                  <Icon as={SquareAsterisk} boxSize={5} color="blue.500" />
                  <Text fontSize="sm">
                    {convertedSession.numberOfCourts} {t('courtsAvailable')}
                    {session.courts && session.courts.length > 0 && (
                      <Text as="span" ml={1}>
                        (
                        {session.courts
                          .slice()
                          .sort((a, b) => a.courtNumber - b.courtNumber)
                          .map((c) => c.courtName || c.courtNumber)
                          .join(', ')}
                        )
                      </Text>
                    )}
                  </Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={Users} boxSize={5} color="blue.500" />
                  <Text fontSize="sm">
                    {t('maxPlayers', { count: convertedSession.maxPlayers })}
                  </Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={User} boxSize={5} color="blue.500" />
                  <Text fontSize="sm">
                    {convertedSession.totalPlayers}/
                    {convertedSession.maxPlayers} {t('players')}
                  </Text>
                </Flex>
              </Stack>
            </Grid>

            {/* Skill Levels */}
            <Flex align="center" gap={3}>
              <Icon as={Shield} boxSize={5} color={skillLevelColor.color} />
              <Wrap gap={1}>
                {session.requiredLevels && session.requiredLevels.length > 0 ? (
                  Array.from(new Set(session.requiredLevels))
                    .sort((a, b) => a - b)
                    .map((level) => {
                      const levelColor = getSkillLevelColor([level]);
                      return (
                        <Badge
                          key={level}
                          colorPalette={levelColor.colorPalette}
                          variant="solid"
                          size="md"
                          fontSize="xs"
                          fontWeight="bold"
                          px={2.5}
                          py={0.5}
                          borderRadius="md"
                        >
                          {getLevelShortLabel(level)}
                        </Badge>
                      );
                    })
                ) : (
                  <Badge
                    colorPalette="gray"
                    variant="subtle"
                    size="md"
                    fontSize="xs"
                    fontWeight="bold"
                    px={2.5}
                    py={0.5}
                    borderRadius="md"
                  >
                    {t('allLevels')}
                  </Badge>
                )}
              </Wrap>
            </Flex>

            {/* Description/Notes */}
            {session.description && (
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                overflow="hidden"
                display="-webkit-box"
                style={{
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {session.description}
              </Text>
            )}

            {/* Footer: Price + Actions */}
            <Stack
              gap={3}
              pt={3}
              mt="auto"
              borderTopWidth="1px"
              borderTopColor="gray.200"
              _dark={{ borderTopColor: 'gray.700' }}
            >
              {/* Row 1: Price and Top Actions */}
              <Flex align="flex-start" justify="space-between" gap={3}>
                {/* Price Section */}
                <Box flexShrink={0} pt={0.5}>
                  {session.feeConfig && (
                    <Flex align="center" gap={1.5}>
                      <Icon as={Banknote} boxSize={5} color="red.600" />
                      <Flex align="center" gap={1.5}>
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
                    </Flex>
                  )}
                </Box>

                {/* Top Action Buttons (e.g. Call, Share, Download) */}
                {(topActionsRendered || oldTopActions) && (
                  <Box flex="1" textAlign="right">
                    <Flex justify="flex-end" gap={2}>
                      {topActionsRendered || oldTopActions || actionButtons}
                    </Flex>
                  </Box>
                )}
              </Flex>

              {/* Row 2: Bottom Action Buttons */}
              {(actions ? renderBottomActions() : bottomActionButtons) && (
                <>
                  {actions ? (
                    renderBottomActions()
                  ) : (
                    <Flex justify="flex-end" gap={2}>
                      {bottomActionButtons}
                    </Flex>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </Box>
      </Box>

      {modalContent}
    </>
  );
};

export default BaseSessionCard;
