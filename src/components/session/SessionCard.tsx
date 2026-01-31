'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { ISession } from '@/lib/api/types';
import { Box, Text, Icon, Flex, Badge } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { Share2, MapPin, Phone, Map, Download } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { CommonModal, useModal } from '@/components/ui/CommonModal';
import BaseSessionCard from './BaseSessionCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { toaster } from '@/components/ui/toaster';
import { useDownloadSessionImage } from '@/hooks/useDownloadSessionImage';
import SessionShareCard from './SessionShareCard';
import { Portal } from '@chakra-ui/react';
import React, { useState } from 'react';
import { PlayerService } from '@/lib/api/player.service';
import MyRegistrationModal from './MyRegistrationModal';

interface SessionCardProps {
  session: ISession;
  onDelete?: (id: string) => void;
  mode?: 'view' | 'manage';
}

const SessionCard = ({
  session,
  onDelete,
  mode = 'view',
}: SessionCardProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const locale = useLocale();
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
  const { downloadSessionImage, isDownloading } = useDownloadSessionImage();

  // Check if current user is the session owner
  const isOwner = session.hostId === user?.id;

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/sessions/${session.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          url: url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback to copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toaster.success({
          title: t('linkCopied') || 'Link copied to clipboard',
        });
      } catch {
        toaster.error({ title: tCommon('error') });
      }
    }
  };

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
        <Icon as={MapPin} boxSize={5} mr={2} color="blue.500" mt={1} />
        <Box flex="1" overflow="hidden">
          <Text fontWeight="medium" lineClamp={1}>
            {session.venue?.name || session.location}
          </Text>
          {session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <Text fontSize="xs" color="gray.500" lineClamp={1}>
                {session.venue.address}
              </Text>
            )}
        </Box>
      </Flex>
    ) : null;

  // Top Actions (Phone, Map, Download, Share)
  const topActions = (
    <Flex justify="flex-end" gap={2}>
      {session.hostPhone && (
        <IconButton
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Call host"
          icon={<Icon as={Phone} />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            window.location.href = `tel:${session.hostPhone}`;
          }}
        />
      )}
      {(session.venue?.address || session.venue?.name || session.location) && (
        <IconButton
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Google Maps"
          icon={<Icon as={Map} />}
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
      )}
      {isOwner && (
        <IconButton
          size="sm"
          colorPalette="blue"
          variant="outline"
          aria-label="Download session image"
          loading={isDownloading}
          icon={<Icon as={Download} />}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            downloadSessionImage(
              session,
              `session-share-card-portrait-${session.id}`
            );
          }}
        />
      )}
      <IconButton
        size="sm"
        colorPalette="gray"
        variant="outline"
        aria-label="Share session"
        icon={<Icon as={Share2} />}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          handleShare();
        }}
      />
    </Flex>
  );

  // Bottom Actions (View, Manage, View Session/Follow)
  const bottomActions = (
    <Flex gap={2} flexWrap="wrap" justify="flex-end">
      <NextLinkButton
        href={`/sessions/${session.id}`}
        colorPalette="gray"
        variant="outline"
        size="sm"
      >
        {t('view')}
      </NextLinkButton>

      {mode === 'manage' || (isOwner && user?.role !== 'PLAYER') ? (
        <NextLinkButton
          href={`/host/sessions/${session.id}`}
          colorPalette="blue"
          size="sm"
        >
          {t('manageSession')}
        </NextLinkButton>
      ) : (isOwner ||
        session.players?.[0]?.registrationStatus === 'APPROVED') ? (
        <NextLinkButton
          href={`/player/sessions/${session.id}`}
          colorPalette="blue"
          size="sm"
        >
          {isOwner && user?.role === 'PLAYER'
            ? t('manageSession')
            : t('viewSession')}
        </NextLinkButton>
      ) : null}

      {!isOwner && session.players?.[0] && (
        <Button
          colorPalette="blue"
          variant="outline"
          onClick={onOpenViewRegistrationModal}
          size="sm"
        >
          {t('viewMyRegistration')}
        </Button>
      )}

      {(mode === 'manage' || isOwner) && onDelete && (
        <Button
          colorPalette="red"
          variant="outline"
          size="sm"
          onClick={onOpenDeleteModal}
        >
          {t('deleteSession')}
        </Button>
      )}
    </Flex>
  );

  // Delete modal
  const deleteModal = onDelete ? (
    <CommonModal
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
    </CommonModal>
  ) : null;

  // Withdraw confirmation modal
  const withdrawModal = (
    <CommonModal
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
    </CommonModal>
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
      registrationBadgeContent={registrationBadge}
      extraInfoRows={locationRow}
      topActionButtons={topActions}
      bottomActionButtons={bottomActions}
      modalContent={
        <>
          {deleteModal}
          {withdrawModal}
          {viewRegistrationModal}
          {/* Hidden SessionShareCards for image generation */}
          {isOwner && (
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
              </Box>
            </Portal>
          )}
        </>
      }
    />
  );
};

export default SessionCard;
