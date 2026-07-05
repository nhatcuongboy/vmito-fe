'use client';

import { useState } from 'react';
import { ISession, UserRole } from '@/lib/api/types';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  formatTimeByDevicePreference,
  formatTimeRangeByDevicePreference,
} from '@/utils/time-helpers';
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
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuPositioner,
  Portal,
  Spinner,
} from '@chakra-ui/react';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import {
  Calendar,
  Clock,
  LayoutGrid,
  Users,
  Shield,
  Banknote,
  Share2,
  Download,
  UserCheck,
  MoreVertical,
  Trash2,
  LogIn,
  Settings,
  UserPlus,
  ClipboardList,
  Feather,
  Play,
  Square,
  ChevronRight,
  Info,
  Facebook,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { FeeService } from '@/lib/api/fee.service';
import { FeeType } from '@/lib/api/types';
import { useLocale, useTranslations } from 'next-intl';
import { Locale } from '@/i18n/locales';
import FeeDetailPopover from '@/components/fee/FeeDetailPopover';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { VALID_LEVELS, sortLevelsByRank } from '@/constants/levels';
import { AppPlayerRating } from '@/components/rating';
import { useAuthStore } from '@/stores/useAuthStore';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { useMyClubIds } from '@/hooks/useMyClubIds';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { toaster } from '@/components/ui/toaster';
import { SessionActionConfig } from './BaseSessionCard.types';
import { Link } from '@/i18n/config';
import dynamic from 'next/dynamic';
import LevelDescriptionsModal from './LevelDescriptionsModal';

// Loaded on demand: pulls in html-to-image, which is only needed when sharing
const SessionShareImageModal = dynamic(
  () => import('./SessionShareImageModal'),
  { ssr: false }
);
import LevelBadgeWithDescription from './LevelBadgeWithDescription';

// Helper functions for formatting with locale support
export const formatDate = (
  dateString: string | Date,
  locale: string
): string => {
  const date = dayjs(dateString)
    .tz('Asia/Ho_Chi_Minh')
    .locale(locale === Locale.VI ? Locale.VI : Locale.EN);

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
  _locale?: string
): string => {
  // Use device time format preference instead of hardcoded HH:mm
  return formatTimeByDevicePreference(dateString);
};

export const formatTimeRange = (
  startTime: string | Date,
  endTime?: string | Date | null,
  endFallback?: string
): string => {
  return formatTimeRangeByDevicePreference(startTime, endTime, endFallback);
};

export const statusColors: Record<string, string> = {
  PREPARING: 'brand',
  IN_PROGRESS: 'green',
  FINISHED: 'gray',
  CANCELLED: 'red',
};

export const getStatusLabel = (
  status: string,
  t: (key: string) => string,
  endTime?: string | Date | null
) => {
  if (status === 'PREPARING' && endTime && new Date(endTime) < new Date()) {
    return t('status.expired') || 'Đã quá hạn';
  }
  switch (status) {
    case 'PREPARING':
      return t('status.preparing');
    case 'IN_PROGRESS':
      return t('status.inProgress');
    case 'FINISHED':
      return t('status.finished');
    case 'CANCELLED':
      return t('status.cancelled');
    default:
      return status;
  }
};

import type { ViewMode } from '@/hooks/useViewMode';

interface BaseSessionCardProps {
  session: ISession;
  variant?: ViewMode;

  // Customization slots
  statusBadgeContent?: React.ReactNode;
  registrationBadgeContent?: React.ReactNode;
  coverPhotoOverlay?: React.ReactNode;
  afterStatusContent?: React.ReactNode;
  extraInfoRows?: React.ReactNode;
  actionButtons?: React.ReactNode;
  compactTopContent?: React.ReactNode;

  // Optional modal
  modalContent?: React.ReactNode;

  // NEW: Action configuration (recommended)
  actions?: SessionActionConfig;

  // DEPRECATED: Action slots (backward compatible)
  topActionButtons?: React.ReactNode;
  bottomActionButtons?: React.ReactNode;

  // Callback for when host info is clicked
  onHostClick?: (e: React.MouseEvent) => void;

  // Disable card-level link (e.g. on detail page to prevent re-navigation)
  disableCardLink?: boolean;

  // Show year in date format (e.g., "Hôm nay, 09/04/26" instead of "Hôm nay, 09/04")
  showYearInDate?: boolean;

  // Always show full day name instead of "Hôm nay"/"Ngày mai" (e.g., "Thứ năm, 09/04/26")
  alwaysShowDayName?: boolean;

  // Eagerly load the cover photo with high fetch priority (set for above-the-fold cards — the page LCP)
  imagePriority?: boolean;
}

const BaseSessionCard = ({
  session,
  variant = 'grid',
  statusBadgeContent,
  registrationBadgeContent,
  coverPhotoOverlay,
  afterStatusContent,
  extraInfoRows,
  actionButtons,
  modalContent,
  hostActions,
  actions,
  topActionButtons,
  bottomActionButtons,
  onHostClick,
  compactTopContent,
  disableCardLink = false,
  showYearInDate = false,
  alwaysShowDayName = false,
  imagePriority = false,
}: BaseSessionCardProps & { hostActions?: React.ReactNode }) => {
  const isCompact = variant === 'list';
  const t = useTranslations('session');
  const tLevelDescriptions = useTranslations('common.levelDescriptions');
  const { getLevelShortLabel } = useLevelLabel();
  const locale = useLocale();
  const { user } = useAuthStore();
  const { clubIds: viewerClubIds } = useMyClubIds();
  const [isLoading, setIsLoading] = useState(false);
  const [isShareImageModalOpen, setIsShareImageModalOpen] = useState(false);
  const [isLevelDescriptionsOpen, setIsLevelDescriptionsOpen] = useState(false);
  const [isMouseOverActionButton, setIsMouseOverActionButton] = useState(false);

  // Compute derived state for action rendering
  const isOwner = user?.id === session.hostId;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const totalPlayers = session._count?.players || 0;
  const isFull = totalPlayers >= maxPlayers;
  // For session cards, always show the session fee (not "Contact host")
  const feeDisplayText = FeeService.getSessionFeeForCard(session);
  const canSeeSessionFee = FeeService.canViewerSeeSessionFee(
    session,
    user?.id,
    viewerClubIds
  );
  // Crawled (vãng lai) Facebook sessions have no managed players — hide the
  // capacity / slot-ratio rows that only apply to internal sessions.
  const isCrawled = session.isCrawled === true;

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

  const handleOpenShareImageModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShareImageModalOpen(true);
  };

  // Render icon buttons (Download, Share, More) - shown in Row 3
  const renderIconButtons = () => {
    if (!actions) return null;

    const buttons: React.ReactNode[] = [];
    const menuItems: React.ReactNode[] = [];

    // Icon buttons: Download (owner only)
    if (actions.showDownloadButton && canManage) {
      buttons.push(
        <IconButton
          key="download"
          size="sm"
          variant="outline"
          colorPalette="gray"
          aria-label={t('downloadImage')}
          shadow="md"
          icon={<Icon as={Download} />}
          onClick={handleOpenShareImageModal}
        />
      );
    }

    // Icon buttons: Share (always available)
    if (actions.showShareButton) {
      buttons.push(
        <IconButton
          key="share"
          size="sm"
          variant="outline"
          colorPalette="gray"
          aria-label="Share"
          shadow="md"
          icon={<Icon as={Share2} />}
          onClick={handleShare}
        />
      );
    }

    // Build menu items for More menu (3 dots)
    const isPastEndTime = session.endTime
      ? new Date(session.endTime) < new Date()
      : false;
    if (
      actions.showStartButton &&
      canManage &&
      actions.onStart &&
      !isPastEndTime
    ) {
      menuItems.push(
        <MenuItem
          key="start"
          value="start"
          color="green.600"
          _hover={{ bg: 'green.50' }}
          onClick={(e) => {
            e.stopPropagation();
            actions.onStart?.();
          }}
        >
          <Icon as={Play} mr={2} />
          {t('startSession')}
        </MenuItem>
      );
    }

    if (actions.showEndButton && canManage && actions.onEnd) {
      menuItems.push(
        <MenuItem
          key="end"
          value="end"
          color="orange.600"
          _hover={{ bg: 'orange.50' }}
          onClick={(e) => {
            e.stopPropagation();
            actions.onEnd?.();
          }}
        >
          <Icon as={Square} mr={2} />
          {t('endSession')}
        </MenuItem>
      );
    }

    if (actions.showDeleteButton && canManage && actions.onDelete) {
      menuItems.push(
        <MenuItem
          key="delete"
          value="delete"
          color="red.600"
          _hover={{ bg: 'red.50' }}
          onClick={(e) => {
            e.stopPropagation();
            actions.onDelete?.(session.id);
          }}
        >
          <Icon as={Trash2} mr={2} />
          {t('deleteSession')}
        </MenuItem>
      );
    }

    // Add More menu (3 dots) if we have menu items
    if (menuItems.length > 0 && actions.showMoreButton !== false) {
      buttons.push(
        <MenuRoot key="more" positioning={{ placement: 'bottom-end' }}>
          <MenuTrigger asChild>
            <IconButton
              size="sm"
              variant="outline"
              colorPalette="gray"
              aria-label="Actions"
              shadow="md"
              loading={actions?.isStartEndLoading}
              icon={<Icon as={MoreVertical} />}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </MenuTrigger>
          <Portal>
            <MenuPositioner zIndex={2000}>
              <MenuContent
                onClick={(e) => e.stopPropagation()}
                bg="white"
                boxShadow="lg"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                zIndex={2001}
              >
                {menuItems}
              </MenuContent>
            </MenuPositioner>
          </Portal>
        </MenuRoot>
      );
    }

    return buttons.length > 0 ? <>{buttons}</> : null;
  };

  // Render top action buttons (Manage/Register buttons only)
  const renderTopActions = () => {
    if (!actions) return null;

    const buttons: React.ReactNode[] = [];

    // Manage button (for owners or admin)
    if (actions.showManageButton && canManage) {
      const manageHref =
        actions.manageButtonHref ||
        (user?.role === UserRole.PLAYER || user?.role === UserRole.REFEREE
          ? `/player/sessions/${session.slug || session.id}`
          : `/host/sessions/${session.slug || session.id}`);
      buttons.push(
        <NextLinkButton
          key="manage"
          href={manageHref}
          colorPalette="green"
          variant="solid"
          size="sm"
          shadow="md"
        >
          <Icon as={Settings} boxSize={4} />
          {t('manageSession')}
        </NextLinkButton>
      );
    }

    // External link button — crawled (vãng lai) Facebook sessions are view-only,
    // this sends the user to the original public post to contact the host there.
    if (actions.showExternalLinkButton && actions.externalUrl) {
      buttons.push(
        <Button
          key="external-link"
          variant="solid"
          size="sm"
          shadow="md"
          bg="#1877F2"
          color="white"
          _hover={{ bg: '#166FE5' }}
          _active={{ bg: '#1558B0' }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            window.open(actions.externalUrl, '_blank', 'noopener,noreferrer');
          }}
        >
          <Icon as={Facebook} boxSize={4} />
          {t('viewOriginalPost')}
        </Button>
      );
    }

    // Register button (for non-registered users, excluding hosts/admins)
    if (actions.showRegisterButton && actions.onRegister && !canManage) {
      buttons.push(
        <Button
          key="register"
          colorPalette="green"
          variant="solid"
          size="sm"
          shadow="md"
          loading={actions.isRegistrationLoading}
          disabled={actions.registerButtonDisabled || isFull}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            actions.onRegister?.();
          }}
        >
          <Icon as={UserPlus} boxSize={4} />
          {isFull ? t('sessionFull') : t('register')}
        </Button>
      );
    }

    return buttons.length > 0 ? <>{buttons}</> : null;
  };

  // Cache rendered top actions to avoid multiple calls
  const topActionsRendered = actions ? renderTopActions() : null;
  const oldTopActions =
    topActionButtons || (actionButtons && !bottomActionButtons);

  // Render bottom action buttons (View Registration button only)
  const renderBottomActions = () => {
    if (!actions) return null;

    // Only show View Registration button at the bottom
    if (actions.showViewRegistrationButton && actions.onViewRegistration) {
      return (
        <Flex w={isCompact ? 'auto' : 'full'} justify="flex-end">
          <Flex gap={2} align="center">
            {actions.compactViewRegistrationButton ? (
              <IconButton
                size="sm"
                variant="subtle"
                colorPalette="green"
                aria-label={t('viewMyRegistration')}
                shadow="md"
                icon={<Icon as={ClipboardList} />}
                loading={actions.isRegistrationLoading}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.onViewRegistration?.();
                }}
              />
            ) : (
              <Button
                colorPalette="green"
                variant="subtle"
                size="sm"
                shadow="md"
                loading={actions.isRegistrationLoading}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.onViewRegistration?.();
                }}
              >
                <Icon as={ClipboardList} boxSize={4} />
                {t('viewMyRegistration')}
              </Button>
            )}
            {actions.showAddGuestButton && actions.onAddGuest && (
              <IconButton
                size="sm"
                variant="outline"
                colorPalette="green"
                aria-label={t('addGuest')}
                shadow="md"
                icon={<Icon as={UserPlus} />}
                disabled={isFull}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.onAddGuest?.();
                }}
              />
            )}
          </Flex>
        </Flex>
      );
    }

    // Show View Session button if needed
    if (actions.showViewSessionButton) {
      const viewSessionHref =
        actions.viewSessionHref ||
        `/player/sessions/${session.slug || session.id}`;
      return (
        <Flex w={isCompact ? 'auto' : 'full'} justify="flex-end">
          <Flex gap={2} align="center">
            <NextLinkButton
              href={viewSessionHref}
              colorPalette="green"
              variant="solid"
              size="sm"
              loading={actions.isRegistrationLoading}
            >
              <Icon as={LogIn} boxSize={4} />
              {t('viewSession')}
            </NextLinkButton>
            {actions.showViewRegistrationButton &&
              actions.onViewRegistration && (
                <IconButton
                  size="sm"
                  variant="outline"
                  colorPalette="green"
                  aria-label={t('viewMyRegistration')}
                  shadow="md"
                  icon={<Icon as={ClipboardList} />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    actions.onViewRegistration?.();
                  }}
                />
              )}
            {actions.showAddGuestButton && actions.onAddGuest && (
              <IconButton
                size="sm"
                variant="outline"
                colorPalette="green"
                aria-label={t('addGuest')}
                shadow="md"
                icon={<Icon as={UserPlus} />}
                disabled={isFull}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  actions.onAddGuest?.();
                }}
              />
            )}
          </Flex>
        </Flex>
      );
    }

    return null;
  };

  const displayHostName = session.hostName || session.host?.name || '';

  const convertedSession = {
    id: session.id,
    title: session.name,
    date: session.startTime
      ? formatDate(session.startTime, locale)
      : formatDate(session.createdAt, locale) + ` (${t('notStarted')})`,
    time: session.startTime
      ? formatTimeRange(session.startTime, session.endTime, t('inProgress'))
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
    const date = dayjs(dateString)
      .tz('Asia/Ho_Chi_Minh')
      .locale(locale === Locale.VI ? Locale.VI : Locale.EN);
    const today = dayjs.tz().startOf('day');
    const tomorrow = today.add(1, 'day');
    const dateToCompare = date.startOf('day');

    let dateLabel = '';
    if (!alwaysShowDayName && dateToCompare.isSame(today)) {
      dateLabel = locale === Locale.VI ? 'Hôm nay' : 'Today';
    } else if (!alwaysShowDayName && dateToCompare.isSame(tomorrow)) {
      dateLabel = locale === Locale.VI ? 'Ngày mai' : 'Tomorrow';
    } else {
      dateLabel =
        locale === Locale.VI ? date.format('dddd') : date.format('ddd');
      dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
    }

    const dateFormat = showYearInDate
      ? locale === Locale.VI
        ? 'DD/MM/YY'
        : 'MM/DD/YY'
      : locale === Locale.VI
        ? 'DD/MM'
        : 'MM/DD';
    return `${dateLabel}, ${date.format(dateFormat)}`;
  };

  const compactDate = session.startTime
    ? formatCompactDate(session.startTime)
    : formatCompactDate(session.createdAt);

  const compactTime = session.startTime
    ? formatTimeRange(session.startTime, session.endTime)
    : '';

  // Calculate level segments for the side strip
  const getLevelSegments = () => {
    if (!session.requiredLevels || session.requiredLevels.length === 0) {
      return ['gray.300']; // Light gray for all levels
    }

    const hasAllLevels = VALID_LEVELS.every((level) =>
      session.requiredLevels!.includes(level)
    );

    if (hasAllLevels) {
      return ['gray.300']; // Keep gray for all levels
    }

    // For multiple levels, show only the highest level color
    const highestLevel = sortLevelsByRank(session.requiredLevels).at(-1)!;
    const highestLevelColor = getSkillLevelColor([highestLevel]).color;
    return [highestLevelColor];
  };

  const levelSegments = getLevelSegments();

  const cardHref = `/sessions/${session.slug || session.id}`;

  const handleCardLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    setIsLoading(true);
    // Reset loading after a delay just in case navigation fails or user comes back
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  };

  const cardContent = (
    <motion.div
      whileTap={
        disableCardLink || isMouseOverActionButton
          ? undefined
          : { scale: 0.98, opacity: 0.95 }
      }
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        position="relative"
        borderWidth="1px"
        borderRadius="2xl"
        overflow="hidden"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)"
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={
          disableCardLink || isMouseOverActionButton
            ? {}
            : {
                transform: 'translateY(-6px)',
                boxShadow:
                  '0 12px 24px rgba(16, 185, 129, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
                borderColor: 'green.200',
              }
        }
        maxW="400px"
        w="100%"
        mx="auto"
        display="flex"
        flexDirection="column"
        height="100%"
        cursor={disableCardLink ? 'default' : 'pointer'}
      >
        {!disableCardLink && (
          <Link
            href={cardHref}
            aria-label={convertedSession.title}
            prefetch={false}
            onClick={handleCardLinkClick}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'block',
              zIndex: 1,
            }}
          />
        )}

        {/* Level Color Strip */}
        <Flex
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          w={isCompact ? '4px' : '6px'}
          direction="column"
          zIndex={2}
          opacity={0.9}
          pointerEvents="none"
        >
          {levelSegments.map((color, index) => (
            <Box key={index} flex={1} bg={color} />
          ))}
        </Flex>

        {/* Cover Image Section - hidden in compact mode */}
        {!isCompact && (
          <Box position="relative" h="180px" overflow="hidden">
            <Image
              src={
                normalizeImageUrl(session.coverPhoto, {
                  cloudinaryWidth: 800,
                }) || DEFAULT_COVER_PHOTO
              }
              alt={session.name}
              w="100%"
              h="100%"
              objectFit="cover"
              loading={imagePriority ? 'eager' : 'lazy'}
              fetchPriority={imagePriority ? 'high' : 'auto'}
              decoding="async"
              onError={(e) => {
                // Hotlinked Facebook images can expire — fall back to default
                const img = e.currentTarget as HTMLImageElement;
                if (img.src !== DEFAULT_COVER_PHOTO) {
                  img.src = DEFAULT_COVER_PHOTO;
                }
              }}
            />
            {/* Status Badge Overlay */}
            <Box position="absolute" top={3} right={3}>
              {statusBadgeContent || (
                <Badge
                  colorPalette={
                    convertedSession.status === 'PREPARING' &&
                    session.endTime &&
                    new Date(session.endTime) < new Date()
                      ? 'gray'
                      : statusColors[convertedSession.status] || 'gray'
                  }
                  fontSize="sm"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontWeight="600"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.15)"
                  backdropFilter="blur(8px)"
                >
                  {getStatusLabel(convertedSession.status, t, session.endTime)}
                </Badge>
              )}
            </Box>
            {/* Registration Status Overlay */}
            {registrationBadgeContent && (
              <Box position="absolute" top={3} left={3}>
                {registrationBadgeContent}
              </Box>
            )}
            {/* Custom Cover Photo Overlay */}
            {coverPhotoOverlay}
          </Box>
        )}

        {/* Content Section */}
        <Box
          p={isCompact ? 3 : { base: 4, sm: 5 }}
          pb={isCompact ? 3 : { base: 4, sm: 5 }}
          flex="1"
          display="flex"
          flexDirection="column"
        >
          <Stack gap={isCompact ? 2 : 4} flex="1">
            {/* Compact-only top content (e.g. suggestion badges) */}
            {isCompact && compactTopContent}

            {/* Title row - in compact mode title is full-width, badges go below */}
            {isCompact ? (
              <>
                <Flex justify="space-between" align="center" gap={2}>
                  <Flex align="center" gap={2} flex={1} overflow="hidden">
                    <Heading size="md" fontWeight="bold" lineClamp={1} flex={1}>
                      {convertedSession.title}
                    </Heading>
                  </Flex>
                  {!disableCardLink && (
                    <Icon
                      as={ChevronRight}
                      boxSize={4}
                      color="gray.400"
                      flexShrink={0}
                    />
                  )}
                </Flex>
                {/* Badges row below title */}
                <Flex gap={1} align="center" wrap="wrap">
                  {registrationBadgeContent}
                  {statusBadgeContent || (
                    <Badge
                      colorPalette={
                        convertedSession.status === 'PREPARING' &&
                        session.endTime &&
                        new Date(session.endTime) < new Date()
                          ? 'gray'
                          : statusColors[convertedSession.status] || 'gray'
                      }
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontWeight="600"
                    >
                      {getStatusLabel(
                        convertedSession.status,
                        t,
                        session.endTime
                      )}
                    </Badge>
                  )}
                </Flex>
              </>
            ) : (
              <Flex justify="space-between" align="flex-start" gap={2}>
                <Heading size="lg" fontWeight="bold">
                  {convertedSession.title}
                </Heading>
                {!disableCardLink && (
                  <Icon as={ChevronRight} boxSize={6} color="gray.400" mt={1} />
                )}
              </Flex>
            )}

            {/* Host Info with Avatar and Rating */}
            {isCompact ? null : (
              <Flex align="center" gap={3}>
                <Box
                  position="relative"
                  zIndex={3}
                  cursor={onHostClick ? 'pointer' : 'default'}
                  onClick={(e) => {
                    if (onHostClick) {
                      e.stopPropagation();
                      onHostClick(e);
                    }
                  }}
                >
                  <Avatar.Root size="sm" bg="brand.500">
                    <Avatar.Fallback name={displayHostName}>
                      {displayHostName
                        ? displayHostName.charAt(0).toUpperCase()
                        : ''}
                    </Avatar.Fallback>
                    {(isCrawled
                      ? session.externalAuthorAvatar
                      : session.host?.image) && (
                      <Avatar.Image
                        src={normalizeImageUrl(
                          isCrawled
                            ? session.externalAuthorAvatar
                            : session.host?.image
                        )}
                      />
                    )}
                  </Avatar.Root>
                </Box>
                <Flex direction="column" align="flex-start" minW={0} flex={1}>
                  <Flex align="center" gap={2} maxW="full">
                    <Text
                      position="relative"
                      zIndex={3}
                      fontSize="sm"
                      fontWeight="semibold"
                      cursor={onHostClick ? 'pointer' : 'default'}
                      _hover={
                        onHostClick ? { textDecoration: 'underline' } : {}
                      }
                      onClick={(e) => {
                        if (onHostClick) {
                          e.stopPropagation();
                          onHostClick(e);
                        }
                      }}
                      lineClamp={1}
                    >
                      {displayHostName}
                    </Text>
                    {/* Bot has no meaningful rating for crawled sessions */}
                    {!isCrawled && (
                      <AppPlayerRating userId={session.hostId} showBullet />
                    )}
                    {hostActions}
                  </Flex>
                  {isCrawled && session.externalSource && (
                    <Text
                      position="relative"
                      zIndex={3}
                      fontSize="xs"
                      color="gray.500"
                      _dark={{ color: 'whiteAlpha.600' }}
                      lineClamp={1}
                      cursor={session.externalGroupUrl ? 'pointer' : 'default'}
                      _hover={
                        session.externalGroupUrl
                          ? { textDecoration: 'underline' }
                          : {}
                      }
                      onClick={
                        session.externalGroupUrl
                          ? (e: React.MouseEvent) => {
                              e.stopPropagation();
                              window.open(
                                session.externalGroupUrl,
                                '_blank',
                                'noopener,noreferrer'
                              );
                            }
                          : undefined
                      }
                    >
                      {session.externalSource}
                    </Text>
                  )}
                </Flex>
              </Flex>
            )}

            {!isCompact && afterStatusContent}

            {/* Location */}
            {extraInfoRows && <Box>{extraInfoRows}</Box>}

            {/* Date & Time + Courts & Players */}
            {isCompact ? (
              <Flex
                wrap="wrap"
                gap={3}
                fontSize="xs"
                color={{ base: 'gray.600', _dark: 'fg.subtle' }}
              >
                <Flex align="center" gap={1}>
                  <Icon as={Calendar} boxSize={4} color="green.500" />
                  <Text fontSize="xs">{compactDate}</Text>
                </Flex>
                <Flex align="center" gap={1}>
                  <Icon as={Clock} boxSize={4} color="green.500" />
                  <Text fontSize="xs">{compactTime}</Text>
                </Flex>
                <Flex align="center" gap={1}>
                  <Icon as={LayoutGrid} boxSize={4} color="green.500" />
                  <Text fontSize="xs">
                    {convertedSession.numberOfCourts} {t('courtsAvailable')}
                  </Text>
                </Flex>
                {!isCrawled && (
                  <Flex align="center" gap={1}>
                    <Icon as={Users} boxSize={4} color="green.500" />
                    <Text fontSize="xs">
                      {t('maxPlayers', { count: convertedSession.maxPlayers })}
                    </Text>
                  </Flex>
                )}
                {!isCrawled && (
                  <Flex align="center" gap={1}>
                    <Icon as={UserCheck} boxSize={4} color="green.500" />
                    <Text fontSize="xs">
                      {convertedSession.totalPlayers}/
                      {convertedSession.maxPlayers} {t('players')}
                    </Text>
                  </Flex>
                )}
                {session.shuttlecock && (
                  <Flex align="center" gap={1} minW={0}>
                    <Icon
                      as={Feather}
                      boxSize={4}
                      color="green.500"
                      flexShrink={0}
                    />
                    <Text fontSize="xs" lineClamp={1} minW={0}>
                      {t('shuttlecock') + ' ' + session.shuttlecock}
                    </Text>
                  </Flex>
                )}
              </Flex>
            ) : (
              <Grid templateColumns="1fr 1fr" gap={2}>
                {/* Row 1: Date & Time */}
                <Flex align="center" gap={2}>
                  <Icon as={Calendar} boxSize={5} color="green.500" />
                  <Text fontSize="sm">{compactDate}</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <Icon as={Clock} boxSize={5} color="green.500" />
                  <Text fontSize="sm">{compactTime}</Text>
                </Flex>

                {/* Row 2: Number of Courts & Max Players */}
                <Flex align="center" gap={2}>
                  <Icon as={LayoutGrid} boxSize={5} color="green.500" />
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
                {!isCrawled && (
                  <Flex align="center" gap={2}>
                    <Icon as={Users} boxSize={5} color="green.500" />
                    <Text fontSize="sm">
                      {t('maxPlayers', { count: convertedSession.maxPlayers })}
                    </Text>
                  </Flex>
                )}

                {!isCrawled && (
                  <Flex align="center" gap={2}>
                    <Icon as={UserCheck} boxSize={5} color="green.500" />
                    <Text fontSize="sm">
                      {convertedSession.totalPlayers}/
                      {convertedSession.maxPlayers} {t('players')}
                    </Text>
                  </Flex>
                )}
                {session.shuttlecock && (
                  <Flex align="center" gap={2} minW={0}>
                    <Icon
                      as={Feather}
                      boxSize={5}
                      color="green.500"
                      flexShrink={0}
                    />
                    <Text fontSize="sm" lineClamp={1} minW={0}>
                      {t('shuttlecock') + ' ' + session.shuttlecock}
                    </Text>
                  </Flex>
                )}
              </Grid>
            )}

            {/* Skill Levels */}
            <Flex align="center" gap={isCompact ? 2 : 3}>
              <Icon
                as={Shield}
                boxSize={isCompact ? 4 : 5}
                color={skillLevelColor.color}
              />
              <Wrap gap={1}>
                {session.requiredLevels && session.requiredLevels.length > 0 ? (
                  sortLevelsByRank(
                    Array.from(new Set(session.requiredLevels))
                  ).map((level) => {
                    const levelColor = getSkillLevelColor([level]);
                    return (
                      <LevelBadgeWithDescription
                        key={level}
                        level={level}
                        colorPalette={levelColor.colorPalette}
                        variant="solid"
                        size={isCompact ? 'sm' : 'md'}
                        fontSize="xs"
                        fontWeight="bold"
                        px={isCompact ? 2 : 2.5}
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
                    size={isCompact ? 'sm' : 'md'}
                    fontSize="xs"
                    fontWeight="bold"
                    px={isCompact ? 2 : 2.5}
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
                position="relative"
                zIndex={3}
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
                icon={<Icon as={Info} boxSize={3} />}
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  setIsLevelDescriptionsOpen(true);
                }}
              />
            </Flex>

            {/* Description/Notes - hidden in compact mode */}
            {!isCompact && session.description && (
              <Text
                fontSize="sm"
                color="gray.500"
                _dark={{ color: 'fg.subtle' }}
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
              gap={isCompact ? 0 : 3}
              pt={isCompact ? 2 : 3}
              mt="auto"
              borderTopWidth="1px"
              borderTopColor="gray.200"
              _dark={{ borderTopColor: 'gray.700' }}
            >
              {isCompact ? (
                <Flex align="center" justify="space-between" gap={2}>
                  {/* Price Section */}
                  <Box flexShrink={0}>
                    {session.feeConfig && (
                      <Flex align="center" gap={1.5}>
                        <Icon
                          as={Banknote}
                          boxSize={4}
                          color={{ base: 'red.600', _dark: 'red.300' }}
                        />
                        <Flex align="center" gap={1}>
                          <Text
                            fontSize="md"
                            fontWeight="bold"
                            color={{ base: 'red.600', _dark: 'red.300' }}
                            whiteSpace="nowrap"
                          >
                            {feeDisplayText}
                          </Text>
                          {canSeeSessionFee &&
                            session.feeConfig.feeType === FeeType.FIXED &&
                            ((session.feeConfig.maleFee || 0) > 0 ||
                              (session.feeConfig.femaleFee || 0) > 0) && (
                              <Text
                                fontSize="xs"
                                color="gray.500"
                                _dark={{ color: 'fg.subtle' }}
                                fontWeight="normal"
                                whiteSpace="nowrap"
                              >
                                /slot
                              </Text>
                            )}
                          <Box
                            position="relative"
                            zIndex={3}
                            onMouseEnter={() =>
                              setIsMouseOverActionButton(true)
                            }
                            onMouseLeave={() =>
                              setIsMouseOverActionButton(false)
                            }
                          >
                            <FeeDetailPopover feeConfig={session.feeConfig} />
                          </Box>
                        </Flex>
                      </Flex>
                    )}
                  </Box>

                  {/* Action Buttons in Compact Mode */}
                  <Flex
                    position="relative"
                    zIndex={3}
                    gap={2}
                    align="center"
                    onMouseEnter={() => setIsMouseOverActionButton(true)}
                    onMouseLeave={() => setIsMouseOverActionButton(false)}
                  >
                    {/* Show top actions (Host/Register buttons) in compact mode */}
                    {topActionsRendered || oldTopActions}
                    {/* Show bottom actions (View Registration button) in compact mode */}
                    {actions ? renderBottomActions() : bottomActionButtons}
                  </Flex>
                </Flex>
              ) : (
                <>
                  {/* Row 1: Price and Top Actions */}
                  <Flex
                    align="flex-start"
                    justify="space-between"
                    gap={2}
                    wrap="wrap"
                  >
                    {/* Price Section */}
                    <Box flexShrink={0} pt={0.5}>
                      {session.feeConfig && (
                        <Flex align="center" gap={1.5}>
                          <Icon
                            as={Banknote}
                            boxSize={isCompact ? 4 : 5}
                            color={{ base: 'red.600', _dark: 'red.300' }}
                          />
                          <Flex align="center" gap={1.5}>
                            <Text
                              fontSize={isCompact ? 'md' : 'lg'}
                              fontWeight="bold"
                              color={{ base: 'red.600', _dark: 'red.300' }}
                              whiteSpace="nowrap"
                            >
                              {feeDisplayText}
                            </Text>
                            {canSeeSessionFee &&
                              session.feeConfig.feeType === FeeType.FIXED &&
                              ((session.feeConfig.maleFee || 0) > 0 ||
                                (session.feeConfig.femaleFee || 0) > 0) && (
                                <Text
                                  fontSize="sm"
                                  color="gray.500"
                                  _dark={{ color: 'fg.subtle' }}
                                  fontWeight="normal"
                                  whiteSpace="nowrap"
                                >
                                  /slot
                                </Text>
                              )}
                            <Box
                              position="relative"
                              zIndex={3}
                              onMouseEnter={() =>
                                setIsMouseOverActionButton(true)
                              }
                              onMouseLeave={() =>
                                setIsMouseOverActionButton(false)
                              }
                            >
                              <FeeDetailPopover feeConfig={session.feeConfig} />
                            </Box>
                          </Flex>
                        </Flex>
                      )}
                    </Box>

                    {/* Top Action Buttons (Manage/Register) */}
                    {!isCompact && (topActionsRendered || oldTopActions) && (
                      <Box
                        position="relative"
                        zIndex={3}
                        flex="1"
                        textAlign="right"
                        minW="120px"
                        onMouseEnter={() => setIsMouseOverActionButton(true)}
                        onMouseLeave={() => setIsMouseOverActionButton(false)}
                      >
                        <Flex justify="flex-end" gap={2} wrap="wrap">
                          {topActionsRendered || oldTopActions || actionButtons}
                        </Flex>
                      </Box>
                    )}
                  </Flex>

                  {/* Row 2: Bottom Action Buttons */}
                  {(actions ? renderBottomActions() : bottomActionButtons) && (
                    <Box
                      position="relative"
                      zIndex={3}
                      onMouseEnter={() => setIsMouseOverActionButton(true)}
                      onMouseLeave={() => setIsMouseOverActionButton(false)}
                    >
                      {actions ? (
                        renderBottomActions()
                      ) : (
                        <Flex justify="flex-end" gap={2}>
                          {bottomActionButtons}
                        </Flex>
                      )}
                    </Box>
                  )}

                  {/* Row 3: Icon Buttons (Download, Share) */}
                  {renderIconButtons() && (
                    <Flex
                      position="relative"
                      zIndex={3}
                      justify="flex-end"
                      gap={2}
                      onMouseEnter={() => setIsMouseOverActionButton(true)}
                      onMouseLeave={() => setIsMouseOverActionButton(false)}
                    >
                      {renderIconButtons()}
                    </Flex>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Loading Overlay */}
        {isLoading && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="whiteAlpha.700"
            _dark={{ bg: 'blackAlpha.700' }}
            align="center"
            justify="center"
            zIndex={10}
          >
            <Spinner size="xl" color="green.500" />
          </Flex>
        )}
      </Box>
    </motion.div>
  );

  return (
    <>
      {cardContent}
      {isShareImageModalOpen && (
        <SessionShareImageModal
          isOpen={isShareImageModalOpen}
          onClose={() => setIsShareImageModalOpen(false)}
          session={session}
        />
      )}
      <LevelDescriptionsModal
        isOpen={isLevelDescriptionsOpen}
        onClose={() => setIsLevelDescriptionsOpen(false)}
      />
      {modalContent}
    </>
  );
};

export default BaseSessionCard;
