'use client';

import { ISession, UserRole } from '@/lib/api/types';
import { Box, Flex, Icon, Text, Badge, Avatar } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Navigation, Facebook } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVenueName, getGoogleMapsUrl } from '@/utils';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import BaseSessionCard from './BaseSessionCard';
import { SessionActionConfig } from './BaseSessionCard.types';
import type { ViewMode } from '@/hooks/useViewMode';
import React, { useState, memo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { VModal, useModal } from '@/components/ui/VModal';
import { SessionService } from '@/lib/api/session.service';
import { toaster } from '@/components/ui/toaster';
import dynamic from 'next/dynamic';

const LoginPromptModal = dynamic(
  () => import('@/components/auth/LoginPromptModal'),
  { ssr: false }
);
const MyRegistrationModal = dynamic(() => import('./MyRegistrationModal'), {
  ssr: false,
});
interface FindSessionCardProps {
  session: ISession;
  variant?: ViewMode;
  onJoin: (session: ISession) => void;
  isJoined?: boolean;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onRegistrationUpdate?: () => void | Promise<void>;
  onDeleteSuccess?: () => void;
  onHostClick?: (session: ISession) => void;
  distance?: number;
  coverPhotoOverlay?: React.ReactNode;
  compactTopContent?: React.ReactNode;
  showSlotBadge?: boolean;
}

const FindSessionCard = ({
  session,
  variant = 'grid',
  onJoin,
  isJoined = false,
  userRegistrationStatus = null,
  onRegistrationUpdate,
  onDeleteSuccess,
  onHostClick,
  distance,
  coverPhotoOverlay,
  compactTopContent,
  showSlotBadge = true,
}: FindSessionCardProps) => {
  const isCompact = variant === 'list';
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const tVenue = useTranslations('venue');
  const { user } = useAuthStore();

  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isOpen: isLoginModalOpen,
    onOpen: onOpenLoginModal,
    onClose: onCloseLoginModal,
  } = useModal();

  const {
    isOpen: isViewRegistrationModalOpen,
    onOpen: onOpenViewRegistrationModal,
    onClose: onCloseViewRegistrationModal,
  } = useModal();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: _onOpenDeleteModal,
    onClose: onCloseDeleteModal,
  } = useModal();

  // Check if current user is the session owner/host or has ADMIN role
  const isOwner = session.hostId === user?.id;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;

  // Crawled (vãng lai) Facebook sessions render a read-only variant:
  // no slot ratio, no host/registration actions — only "view original post".
  const isCrawled = session.isCrawled === true;

  // Calculate if session is full (only count approved players)
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;

  // Handle delete session
  const handleDeleteSession = async () => {
    try {
      setIsDeleting(true);
      await SessionService.deleteSession(session.id);
      toaster.success({
        title: tCommon('success') || 'Session deleted successfully',
      });
      onCloseDeleteModal();
      onDeleteSuccess?.();
      onRegistrationUpdate?.(); // Fallback to refresh list
    } catch (error) {
      console.error('Error deleting session:', error);
      toaster.error({ title: tCommon('error') });
    } finally {
      setIsDeleting(false);
    }
  };

  const googleMapButton =
    session.venue?.address || session.venue?.name || session.location ? (
      <IconButton
        size="xs"
        colorPalette="green"
        variant="ghost"
        aria-label="Google Maps"
        icon={<Icon as={Navigation} />}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          const url = getGoogleMapsUrl({
            address: session.venue?.address,
            name: session.venue?.name || session.location,
            placeId: session.venue?.placeId,
            lat: session.venue?.lat,
            lng: session.venue?.lng,
          });
          if (url) window.open(url, '_blank');
        }}
      />
    ) : null;

  // Location/venue display
  const locationRow =
    session.venue?.name || session.location ? (
      <Flex align="flex-start">
        <Icon
          as={MapPin}
          boxSize={isCompact ? 4 : 5}
          mr={2}
          color="green.500"
          mt={isCompact ? 0.5 : 1}
          flexShrink={0}
        />
        <Box flex="1" overflow="hidden" minW={0}>
          <Flex align="center" gap={2}>
            <Text
              fontWeight="medium"
              fontSize={isCompact ? 'sm' : 'md'}
              lineClamp={1}
              flex="1"
              minW={0}
            >
              {session.venue?.name
                ? formatVenueName(
                    session.venue.name,
                    tVenue('nameFormat', { name: '{name}' })
                  )
                : session.location}
            </Text>
            {distance !== undefined && (
              <Badge
                colorPalette="green"
                variant="subtle"
                size="sm"
                flexShrink={0}
              >
                {distance < 1
                  ? `${Math.round(distance * 1000)}m`
                  : `${distance.toFixed(1)}km`}
              </Badge>
            )}
            {googleMapButton}
          </Flex>
          {!isCompact &&
            session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <AppAddressDisplay
                address={session.venue.address}
                district={session.venue.district}
                newAddress={session.venue.newAddress}
                newDistrict={session.venue.newDistrict}
                lineClamp={1}
              />
            )}
        </Box>
      </Flex>
    ) : null;

  const extraInfoRows = <>{locationRow}</>;

  // Slot availability badge - hidden if session is expired
  const isExpired =
    session.status === 'PREPARING' &&
    session.endTime &&
    new Date(session.endTime) < new Date();
  const availableSlots = maxPlayers - approvedPlayersCount;
  const slotAvailabilityBadge = !isExpired ? (
    <Badge
      colorPalette={isFull ? 'gray' : 'teal'}
      variant="solid"
      borderWidth="1px"
      borderColor={isFull ? 'gray.400' : 'teal.400'}
    >
      {isFull ? t('slotsFull') : t('slotsAvailable', { count: availableSlots })}
    </Badge>
  ) : null;

  // Registration status badge
  const registrationStatusBadge = userRegistrationStatus ? (
    <Badge
      colorPalette={
        userRegistrationStatus === 'APPROVED'
          ? 'green'
          : userRegistrationStatus === 'PENDING'
            ? 'yellow'
            : 'red'
      }
      variant="solid"
      borderWidth="1px"
      borderColor={
        userRegistrationStatus === 'APPROVED'
          ? 'green.400'
          : userRegistrationStatus === 'PENDING'
            ? 'yellow.400'
            : 'red.400'
      }
    >
      {userRegistrationStatus === 'APPROVED'
        ? t('registrationApproved')
        : userRegistrationStatus === 'PENDING'
          ? t('registrationPending')
          : t('registrationRejected')}
    </Badge>
  ) : null;

  // "Bài đăng Facebook" badge for crawled Facebook sessions (translucent gray to balance visual weight)
  const crawledBadge = isCrawled ? (
    <Badge
      bg="blackAlpha.600"
      _dark={{ bg: 'whiteAlpha.200' }}
      color="white"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(4px)"
      gap={1}
    >
      <Icon as={Facebook} boxSize={3} />
      {t('crawledBadge')}
    </Badge>
  ) : null;

  const combinedBadges = (
    <Flex gap={1}>
      {crawledBadge}
      {/* Crawled sessions have no managed player slots — hide the slot badge */}
      {!isCrawled && showSlotBadge && slotAvailabilityBadge}
      {registrationStatusBadge}
    </Flex>
  );

  // Handle register action
  const handleRegister = () => {
    if (!user) {
      onOpenLoginModal();
      return;
    }
    onJoin(session);
  };

  // Action configuration for find session card
  // Logic: Show only ONE button
  // - If user is host/admin: show "Host" (manage) button only
  // - If user is not host: show ONE button based on registration status
  //   - APPROVED: show "Vào sân" (view session)
  //   - PENDING/REJECTED: show "Xem đăng ký" (view registration)
  //   - No registration: show "Đăng ký" (register)
  const actions: SessionActionConfig = isCrawled
    ? {
        // Crawled (vãng lai) sessions are view-only: no host/registration
        // actions on Vmito — only a link out to the original Facebook post.
        showMoreButton: false,
        showCallButton: false,
        showDownloadButton: false,
        showShareButton: false,
        showDeleteButton: false,
        showManageButton: false,
        showViewSessionButton: false,
        showViewRegistrationButton: false,
        showRegisterButton: false,
        showExternalLinkButton: !!session.externalUrl,
        externalUrl: session.externalUrl,
      }
    : {
        // Hide all extra buttons
        showMoreButton: false,
        showCallButton: false,
        showDownloadButton: false,
        showShareButton: false,
        showDeleteButton: false,

        // For owner or ADMIN: show ONLY manage button
        showManageButton: canManage,
        manageButtonHref: `/host/sessions/${session.slug || session.id}`,

        // For non-owners: show ONE button based on status
        // Priority: APPROVED > PENDING/REJECTED > No registration
        showViewSessionButton:
          !canManage && userRegistrationStatus === 'APPROVED',
        showViewRegistrationButton:
          !canManage &&
          !!userRegistrationStatus &&
          userRegistrationStatus !== 'APPROVED',
        onViewRegistration: onOpenViewRegistrationModal,
        showRegisterButton: !canManage && !userRegistrationStatus && !isJoined,
        onRegister: handleRegister,
        registerButtonDisabled: isFull,
      };

  return (
    <>
      <BaseSessionCard
        session={session}
        variant={variant}
        extraInfoRows={extraInfoRows}
        registrationBadgeContent={combinedBadges}
        coverPhotoOverlay={coverPhotoOverlay}
        compactTopContent={compactTopContent}
        actions={actions}
        onHostClick={
          isCrawled
            ? session.externalAuthorUrl
              ? () =>
                  window.open(
                    session.externalAuthorUrl,
                    '_blank',
                    'noopener,noreferrer'
                  )
              : undefined
            : onHostClick
              ? () => onHostClick(session)
              : undefined
        }
      />

      {/* Login prompt modal */}
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={onCloseLoginModal}
        returnUrl={`/sessions/${session.slug || session.id}?register=true`}
      />

      <MyRegistrationModal
        isOpen={isViewRegistrationModalOpen}
        onClose={onCloseViewRegistrationModal}
        session={session}
        onWithdraw={() => {
          onCloseViewRegistrationModal();
          onRegistrationUpdate?.();
        }}
      />

      {/* Delete confirmation modal */}
      <VModal
        isOpen={isDeleteModalOpen}
        onClose={onCloseDeleteModal}
        title={t('deleteSession')}
        primaryActionText={tCommon('confirm')}
        secondaryActionText={tCommon('cancel')}
        onPrimaryAction={handleDeleteSession}
        primaryColorScheme="red"
        isPrimaryLoading={isDeleting}
      >
        <Text>{t('deleteConfirmation')}</Text>
      </VModal>
    </>
  );
};

export default memo(FindSessionCard);
