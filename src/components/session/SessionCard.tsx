'use client';

import { ISession, UserRole, SessionStatus } from '@/lib/api/types';
import { SessionService } from '@/lib/api/session.service';
import { Box, Text, Icon, Flex, Badge, Alert } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VModal, useModal } from '@/components/ui/VModal';
import BaseSessionCard from './BaseSessionCard';
import { SessionActionConfig } from './BaseSessionCard.types';
import { useAuthStore } from '@/stores/useAuthStore';
import { toaster } from '@/components/ui/toaster';
import SessionShareCard from './SessionShareCard';
import { Portal } from '@chakra-ui/react';
import React, { useState } from 'react';
import { PlayerService } from '@/lib/api/player.service';
import MyRegistrationModal from './MyRegistrationModal';

interface SessionCardProps {
  session: ISession;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  mode?: 'view' | 'manage';
  onHostClick?: () => void;
  variant?: 'full' | 'compact';
}

const SessionCard = ({
  session,
  onDelete,
  onRefresh,
  mode = 'view',
  onHostClick,
  variant = 'full',
}: SessionCardProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
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

  // Slot availability badge
  const slotAvailabilityBadge = (
    <Badge
      colorPalette={isFull ? 'gray' : 'teal'}
      variant="solid"
      borderWidth="1px"
      borderColor={isFull ? 'gray.400' : 'teal.400'}
    >
      {isFull ? t('slotsFull') : t('slotsAvailable', { count: availableSlots })}
    </Badge>
  );

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
        <Icon as={MapPin} boxSize={5} mr={2} color="green.500" mt={1} />
        <Box flex="1" overflow="hidden">
          <Flex align="center" gap={1}>
            <Text fontWeight="medium" lineClamp={1}>
              {session.venue?.name || session.location}
            </Text>
            <IconButton
              size="xs"
              colorPalette="green"
              variant="ghost"
              aria-label="Google Maps"
              icon={<Icon as={Navigation} />}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                const address =
                  session.venue?.address ||
                  session.venue?.name ||
                  session.location;
                if (address) {
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                    '_blank'
                  );
                }
              }}
            />
          </Flex>
          {session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {session.venue.address}
              </Text>
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

  // Action configuration for session card
  const actions: SessionActionConfig = {
    // Top actions
    showCallButton: !!session.hostPhone,
    showDownloadButton: canManage,
    showShareButton: true,

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
    showViewRegistrationButton:
      !isOwner &&
      !!session.players?.[0] &&
      session.players[0].registrationStatus !== 'APPROVED',
    onViewRegistration: onOpenViewRegistrationModal,

    // Manage button (for owners or ADMIN)
    showManageButton: canManage,
    // manageButtonHref:
    //   user?.role === UserRole.PLAYER
    //     ? `/player/sessions/${session.id}`
    //     : `/host/sessions/${session.id}`,
    manageButtonHref: `/host/sessions/${session.id}`,

    // View session button (for approved players, NOT for owners)
    showViewSessionButton:
      session.players?.[0]?.registrationStatus === 'APPROVED' && !isOwner,
    viewSessionHref: `/player/sessions/${session.id}`,
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
      actions={actions}
      onHostClick={onHostClick}
      modalContent={
        <>
          {deleteModal}
          {viewRegistrationModal}
          {endConfirmModal}
          {/* Hidden SessionShareCards for image generation */}
          {canManage && (
            <Portal>
              <Box
                position="absolute"
                left="-9999px"
                top="-9999px"
                zIndex={-1}
                pointerEvents="none"
              >
                <Box>
                  <SessionShareCard session={session} mode="portrait" />
                </Box>
                <Box mt={4}>
                  <SessionShareCard session={session} mode="social" />
                </Box>
              </Box>
            </Portal>
          )}
        </>
      }
    />
  );
};

export default SessionCard;
