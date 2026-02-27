'use client';

import { ISession, UserRole } from '@/lib/api/types';
import { Box, Text, Icon, Flex, Badge } from '@chakra-ui/react';
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
  mode?: 'view' | 'manage';
  onHostClick?: () => void;
  variant?: 'full' | 'compact';
}

const SessionCard = ({
  session,
  onDelete,
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
    isOpen: isWithdrawModalOpen,
    onOpen: onOpenWithdrawModal,
    onClose: onCloseWithdrawModal,
  } = useModal();

  const {
    isOpen: isViewRegistrationModalOpen,
    onOpen: onOpenViewRegistrationModal,
    onClose: onCloseViewRegistrationModal,
  } = useModal();

  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Check if current user is the session owner or has ADMIN role
  const isOwner = session.hostId === user?.id;
  const isAdmin = user?.role === UserRole.ADMIN;
  const canManage = isOwner || isAdmin;

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
      // Refresh to update UI
      window.location.reload();
    } catch (error) {
      console.error('Error withdrawing request:', error);
      toaster.error({ title: tCommon('error') });
    } finally {
      setIsWithdrawing(false);
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

  // Action configuration for session card
  const actions: SessionActionConfig = {
    // Top actions
    showCallButton: !!session.hostPhone,
    showDownloadButton: canManage,
    showShareButton: true,

    // Bottom actions
    showDeleteButton: (mode === 'manage' || canManage) && !!onDelete,
    onDelete: onDelete ? () => onOpenDeleteModal() : undefined,

    // View button (always show)
    showViewButton: true,

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

  // Withdraw confirmation modal
  const withdrawModal = (
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
  );

  // View Registration modal
  const viewRegistrationModal = (
    <MyRegistrationModal
      isOpen={isViewRegistrationModalOpen}
      onClose={onCloseViewRegistrationModal}
      session={session}
      onWithdraw={() => {
        onCloseViewRegistrationModal();
        onOpenWithdrawModal();
      }}
    />
  );

  return (
    <BaseSessionCard
      session={session}
      variant={variant}
      registrationBadgeContent={registrationBadge}
      extraInfoRows={locationRow}
      actions={actions}
      onHostClick={onHostClick}
      modalContent={
        <>
          {deleteModal}
          {withdrawModal}
          {viewRegistrationModal}
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
