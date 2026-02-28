'use client';

import { ISession, UserRole } from '@/lib/api/types';
import { Box, Flex, Icon, Text, Badge } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Navigation } from 'lucide-react';
import { useTranslations } from 'next-intl';
import BaseSessionCard from './BaseSessionCard';
import { SessionActionConfig } from './BaseSessionCard.types';
import { ViewMode } from '@/stores/useSessionFilterStore';
import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { VModal, useModal } from '@/components/ui/VModal';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
import { toaster } from '@/components/ui/toaster';
import MyRegistrationModal from './MyRegistrationModal';
import SessionShareCard from './SessionShareCard';
import { Portal } from '@chakra-ui/react';

interface FindSessionCardProps {
  session: ISession;
  variant?: ViewMode;
  onJoin: () => void;
  isJoined?: boolean;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onRegistrationUpdate?: () => void | Promise<void>;
  onDeleteSuccess?: () => void;
  onHostClick?: () => void;
  distance?: number;
  coverPhotoOverlay?: React.ReactNode;
  compactTopContent?: React.ReactNode;
  showSlotBadge?: boolean;
}

const FindSessionCard = ({
  session,
  variant = 'full',
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
  const isCompact = variant === 'compact';
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    isOpen: isLoginModalOpen,
    onOpen: onOpenLoginModal,
    onClose: onCloseLoginModal,
  } = useModal();

  const {
    isOpen: isWithdrawModalOpen,
    onOpen: onOpenWithdrawModal,
    onClose: onCloseWithdrawModal,
  } = useModal();

  const {
    isOpen: isViewRegistrationModalOpen,
    onOpen: onOpenViewRegistrationModal,
    onClose: onCloseViewRegistrationModal,
  } = useModal();

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal,
  } = useModal();

  // Check if current user is the session owner/host or has ADMIN role
  const isOwner = session.hostId === user?.id;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;

  // Calculate if session is full (only count approved players)
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;

  // Handle withdraw request
  const handleWithdrawRequest = async () => {
    if (!user) return;

    try {
      setIsWithdrawing(true);

      // Get user's players for this session from backend
      const myPlayers = await PlayerService.getMyPlayersForSession(session.id);

      // Find pending players to delete
      const pendingPlayers = myPlayers.filter(
        (p) => p.registrationStatus === 'PENDING'
      );

      if (pendingPlayers.length === 0) {
        toaster.warning({ title: t('noPendingRequest') });
        onCloseWithdrawModal();
        return;
      }

      // Delete all pending players
      await Promise.all(
        pendingPlayers.map((p) =>
          PlayerService.deletePlayerBySession(session.id, p.id)
        )
      );

      toaster.success({ title: t('requestWithdrawn') });
      onCloseWithdrawModal();
      onRegistrationUpdate?.();
    } catch (error) {
      console.error('Error withdrawing request:', error);
      toaster.error({ title: tCommon('error') });
    } finally {
      setIsWithdrawing(false);
    }
  };

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
          const address =
            session.venue?.address || session.venue?.name || session.location;
          if (address) {
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
              '_blank'
            );
          }
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
        />
        <Box flex="1" overflow="hidden">
          <Flex align="center" gap={2} wrap="wrap">
            <Text
              fontWeight="medium"
              fontSize={isCompact ? 'sm' : 'md'}
              lineClamp={1}
            >
              {session.venue?.name || session.location}
            </Text>
            {distance !== undefined && (
              <Badge colorPalette="green" variant="subtle" size="sm">
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
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {session.venue.address}
              </Text>
            )}
        </Box>
      </Flex>
    ) : null;

  // Slot availability badge
  const availableSlots = maxPlayers - approvedPlayersCount;
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

  const combinedBadges = (
    <Flex gap={1}>
      {showSlotBadge && slotAvailabilityBadge}
      {registrationStatusBadge}
    </Flex>
  );

  // Handle register action
  const handleRegister = () => {
    if (!user) {
      onOpenLoginModal();
      return;
    }
    onJoin();
  };

  // Action configuration for find session card
  const actions: SessionActionConfig = {
    // Top actions
    showCallButton: !!session.hostPhone,
    showDownloadButton: canManage,
    showShareButton: true,

    // Bottom actions - delete
    showDeleteButton: canManage,
    onDelete: onOpenDeleteModal,

    // Bottom actions - right side
    // For owner or ADMIN: show manage button
    showManageButton: canManage,
    // manageButtonHref:
    //   user?.role === UserRole.PLAYER
    //     ? `/player/sessions/${session.id}`
    //     : `/host/sessions/${session.id}`,
    manageButtonHref: `/host/sessions/${session.id}`,

    // For players with registration: show view registration modal
    showViewRegistrationButton:
      !isOwner &&
      !!userRegistrationStatus &&
      userRegistrationStatus !== 'APPROVED',
    onViewRegistration: onOpenViewRegistrationModal,

    // For approved players: show view session button
    showViewSessionButton: userRegistrationStatus === 'APPROVED',

    // For non-registered users: show register button (hidden for owners)
    showRegisterButton: !userRegistrationStatus && !isJoined && !isOwner,
    onRegister: handleRegister,
    registerButtonDisabled: isFull,
  };

  return (
    <>
      <BaseSessionCard
        session={session}
        variant={variant}
        extraInfoRows={locationRow}
        registrationBadgeContent={combinedBadges}
        coverPhotoOverlay={coverPhotoOverlay}
        compactTopContent={compactTopContent}
        actions={actions}
        onHostClick={onHostClick}
      />

      {/* Login prompt modal */}
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={onCloseLoginModal}
        returnUrl={`/sessions/${session.id}?register=true`}
      />

      {/* Withdraw confirmation modal */}
      <VModal
        isOpen={isWithdrawModalOpen}
        onClose={onCloseWithdrawModal}
        title={t('withdrawRequest')}
        primaryActionText={tCommon('confirm')}
        secondaryActionText={tCommon('cancel')}
        onPrimaryAction={handleWithdrawRequest}
        primaryColorScheme="red"
        isPrimaryLoading={isWithdrawing}
      >
        <Text>{t('withdrawConfirmation')}</Text>
      </VModal>

      {/* View Registration modal */}
      <MyRegistrationModal
        isOpen={isViewRegistrationModalOpen}
        onClose={onCloseViewRegistrationModal}
        session={session}
        onWithdraw={() => {
          onCloseViewRegistrationModal(); // Close registration modal first
          onOpenWithdrawModal(); // Then open withdraw confirmation
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
  );
};

export default FindSessionCard;
