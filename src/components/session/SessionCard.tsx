'use client';

import { ISession, UserRole, SessionStatus } from '@/lib/api/types';
import { SessionService } from '@/lib/api/session.service';
import { Box, Text, Icon, Flex, Badge, Alert } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Navigation, LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatVenueName, getGoogleMapsUrl } from '@/utils';
import { AppAddressDisplay } from '@/components/common/AppAddressDisplay';
import { VModal, useModal } from '@/components/ui/VModal';
import BaseSessionCard from './BaseSessionCard';
import { SessionActionConfig } from './BaseSessionCard.types';
import { useAuthStore } from '@/stores/useAuthStore';
import { toaster } from '@/components/ui/toaster';
import React, { useState } from 'react';
import MyRegistrationModal from './MyRegistrationModal';
import type { ViewMode } from '@/hooks/useViewMode';
import { NextLinkButton } from '@/components/ui/NextLinkButton';

interface SessionCardProps {
  session: ISession;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  mode?: 'view' | 'manage';
  onHostClick?: () => void;
  variant?: ViewMode;
  showDownloadShareButtons?: boolean;
  forceViewSessionButton?: boolean;
  onAddGuest?: (session: ISession) => void;
}

const SessionCard = ({
  session,
  onDelete,
  onRefresh,
  mode = 'view',
  onHostClick,
  variant = 'grid',
  showDownloadShareButtons = false,
  forceViewSessionButton = false,
  onAddGuest,
}: SessionCardProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const tVenue = useTranslations('venue');
  const { user } = useAuthStore();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal,
  } = useModal();
  const {
    isOpen: isViewRegistrationModalOpen,
    onOpen: onOpenViewRegistrationModal,
    onClose: onCloseViewRegistrationModal,
  } = useModal();

  const {
    isOpen: isEndConfirmModalOpen,
    onOpen: onOpenEndConfirmModal,
    onClose: onCloseEndConfirmModal,
  } = useModal();

  const [isStartEndLoading, setIsStartEndLoading] = useState(false);

  // Check if current user is the session owner or has ADMIN role
  const isOwner = session.hostId === user?.id;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;

  const isPastEndTime = (() => {
    if (session.endTime) {
      return new Date(session.endTime) < new Date();
    }
    if (session.startTime) {
      const computedEndTime = new Date(session.startTime);
      computedEndTime.setMinutes(
        computedEndTime.getMinutes() + (session.sessionDuration || 120)
      );
      return computedEndTime < new Date();
    }
    return false;
  })();

  // Calculate slot availability
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;
  const availableSlots = maxPlayers - approvedPlayersCount;

  // Slot availability badge - hidden if session is expired
  const isExpired =
    session.status === 'PREPARING' &&
    session.endTime &&
    new Date(session.endTime) < new Date();
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

  // Handle start session
  const handleStart = async () => {
    try {
      setIsStartEndLoading(true);
      await SessionService.startSession(session.id);
      toaster.success({ title: t('sessionStarted') || 'Session started' });
      onRefresh?.();
    } catch (err) {
      console.error('Error starting session:', err);
      toaster.error({
        title: t('errorUpdatingSessionStatus') || 'Failed to start session',
      });
    } finally {
      setIsStartEndLoading(false);
    }
  };

  // Handle end session (called after confirmation)
  const handleEndConfirmed = async () => {
    onCloseEndConfirmModal();
    try {
      setIsStartEndLoading(true);
      await SessionService.endSession(session.id);
      toaster.success({ title: t('sessionEnded') || 'Session ended' });
      onRefresh?.();
    } catch (err) {
      console.error('Error ending session:', err);
      toaster.error({
        title: t('errorUpdatingSessionStatus') || 'Failed to end session',
      });
    } finally {
      setIsStartEndLoading(false);
    }
  };

  // Registration status badge (owner/player view of their status)
  const registrationBadge = (() => {
    const status = session.players?.[0]?.registrationStatus;
    if (status === 'PENDING') {
      return (
        <Badge colorPalette="yellow" variant="solid">
          {t('registrationPending')}
        </Badge>
      );
    }
    if (status === 'REJECTED') {
      return (
        <Badge colorPalette="red" variant="solid">
          {t('registrationRejected')}
        </Badge>
      );
    }
    if (status === 'APPROVED') {
      return (
        <Badge colorPalette="green" variant="solid">
          {t('registrationApproved')}
        </Badge>
      );
    }
    return null;
  })();

  // Combine badges
  const combinedBadges = (
    <Flex gap={1}>
      {slotAvailabilityBadge}
      {registrationBadge}
    </Flex>
  );

  // Location/venue display
  const locationRow =
    session.venue?.name || session.location ? (
      <Flex align="flex-start">
        <Icon
          as={MapPin}
          boxSize={5}
          mr={2}
          color="green.500"
          mt={1}
          flexShrink={0}
        />
        <Box flex="1" overflow="hidden" minW={0}>
          <Flex align="center" gap={1}>
            <Text fontWeight="medium" lineClamp={1} flex="1" minW={0}>
              {session.venue?.name
                ? formatVenueName(
                    session.venue.name,
                    tVenue('nameFormat', { name: '{name}' })
                  )
                : session.location}
            </Text>
            <IconButton
              size="xs"
              colorPalette="green"
              variant="ghost"
              aria-label="Google Maps"
              icon={<Icon as={Navigation} />}
              flexShrink={0}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                const url = getGoogleMapsUrl({
                  address: session.venue?.address,
                  name: session.venue?.name
                    ? formatVenueName(
                        session.venue.name,
                        tVenue('nameFormat', { name: '{name}' })
                      )
                    : session.location,
                  placeId: session.venue?.placeId,
                  lat: session.venue?.lat,
                  lng: session.venue?.lng,
                });
                if (url) window.open(url, '_blank');
              }}
            />
          </Flex>
          {session.venue?.address &&
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

  const combinedExtraInfo = (
    <Flex direction="column" gap={2}>
      {locationRow}
      {canManage &&
        session.status === SessionStatus.PREPARING &&
        isPastEndTime && (
          <Alert.Root
            status="warning"
            size="sm"
            mt={locationRow ? 0 : 2}
            borderRadius="md"
            py={2}
            px={3}
          >
            <Alert.Title fontSize="11px" fontWeight="medium">
              {t('pastEndWarning')}
            </Alert.Title>
          </Alert.Root>
        )}
    </Flex>
  );

  const viewSessionHref = `/player/sessions/${session.slug || session.id}`;
  const viewSessionButton = forceViewSessionButton ? (
    <NextLinkButton
      href={viewSessionHref}
      colorPalette="green"
      variant="solid"
      size="sm"
      shadow="md"
    >
      <Icon as={LogIn} boxSize={4} />
      {t('viewSession')}
    </NextLinkButton>
  ) : null;

  // Action configuration for session card
  const actions: SessionActionConfig = {
    // Top actions
    showCallButton: !!session.hostPhone,
    showDownloadButton: showDownloadShareButtons && canManage,
    showShareButton: showDownloadShareButtons,

    // Bottom actions - 3-dot menu
    showDeleteButton: (mode === 'manage' || canManage) && !!onDelete,
    onDelete: onDelete ? () => onOpenDeleteModal() : undefined,

    // Start session - only for PREPARING sessions when user can manage
    showStartButton:
      canManage && session.status === SessionStatus.PREPARING && !isPastEndTime,
    onStart: handleStart,

    // End session - only for IN_PROGRESS sessions when user can manage
    showEndButton: canManage && session.status === SessionStatus.IN_PROGRESS,
    onEnd: onOpenEndConfirmModal,

    isStartEndLoading,

    // View registration button (for non-owners with registration)
    showViewRegistrationButton: !isOwner && !!session.players?.[0],
    onViewRegistration: onOpenViewRegistrationModal,
    // Icon-only "Xem vé" button when the view-session button is forced off
    // (e.g. the joined-sessions list), to match the compact icon style used
    // alongside the view-session button elsewhere.
    compactViewRegistrationButton: forceViewSessionButton,

    // Add guest button (for non-owners with an existing registration)
    showAddGuestButton: !isOwner && !!session.players?.[0] && !!onAddGuest,
    onAddGuest: onAddGuest ? () => onAddGuest(session) : undefined,

    // Manage button (for owners or ADMIN)
    showManageButton: canManage && !forceViewSessionButton,
    // manageButtonHref:
    //   user?.role === UserRole.PLAYER
    //     ? `/player/sessions/${session.slug || session.id}`
    //     : `/host/sessions/${session.slug || session.id}`,
    manageButtonHref: `/host/sessions/${session.slug || session.id}`,

    // View session button (approved players only when not forced)
    showViewSessionButton:
      !forceViewSessionButton &&
      session.players?.[0]?.registrationStatus === 'APPROVED' &&
      !isOwner,
    viewSessionHref,
  };

  // Delete modal
  const deleteModal = onDelete ? (
    <VModal
      isOpen={isDeleteModalOpen}
      onClose={onCloseDeleteModal}
      title={t('deleteSession')}
      primaryActionText={tCommon('delete')}
      secondaryActionText={tCommon('cancel')}
      onPrimaryAction={() => {
        onDelete(session.id);
        onCloseDeleteModal();
      }}
      primaryColorScheme="red"
    >
      <Text>{t('deleteConfirmation')}</Text>
    </VModal>
  ) : null;

  // View Registration modal
  const viewRegistrationModal = (
    <MyRegistrationModal
      isOpen={isViewRegistrationModalOpen}
      onClose={onCloseViewRegistrationModal}
      session={session}
      onWithdraw={() => {
        onCloseViewRegistrationModal();
        window.location.reload();
      }}
    />
  );

  // End session confirmation modal
  const endConfirmModal = (
    <VModal
      isOpen={isEndConfirmModalOpen}
      onClose={onCloseEndConfirmModal}
      title={t('confirmEndSession')}
      primaryActionText={t('endSession')}
      secondaryActionText={tCommon('cancel')}
      onPrimaryAction={handleEndConfirmed}
      primaryColorScheme="orange"
    >
      <Text>{t('confirmEndSessionMessage')}</Text>
    </VModal>
  );

  return (
    <BaseSessionCard
      session={session}
      variant={variant}
      registrationBadgeContent={combinedBadges}
      extraInfoRows={combinedExtraInfo}
      topActionButtons={viewSessionButton || undefined}
      actions={actions}
      onHostClick={onHostClick}
      modalContent={
        <>
          {deleteModal}
          {viewRegistrationModal}
          {endConfirmModal}
        </>
      }
    />
  );
};

export default SessionCard;
