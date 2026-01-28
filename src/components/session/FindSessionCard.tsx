'use client';

import { ISession } from '@/lib/api/types';
import { Box, Flex, Icon, Text, Badge } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Phone, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import BaseSessionCard from './BaseSessionCard';
import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { CommonModal, useModal } from '@/components/ui/CommonModal';
import { PlayerService } from '@/lib/api/player.service';
import { toaster } from '@/components/ui/toaster';
import MyRegistrationModal from './MyRegistrationModal';

interface FindSessionCardProps {
  session: ISession;
  onJoin: () => void;
  isJoined?: boolean;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  onRegistrationUpdate?: () => void;
}

const FindSessionCard = ({
  session,
  onJoin,
  isJoined = false,
  userRegistrationStatus = null,
  onRegistrationUpdate,
}: FindSessionCardProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

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

  // Check if current user is the session owner/host
  const isOwner = session.hostId === user?.id;

  // Calculate if session is full (only count approved players)
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/sessions/${session.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: session.name,
          text: session.description || `Join ${session.name}`,
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
      onRegistrationUpdate?.();
    } catch (error) {
      console.error('Error withdrawing request:', error);
      toaster.error({ title: tCommon('error') });
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Location/venue display
  const locationRow =
    session.venue?.name || session.location ? (
      <Flex align="flex-start">
        <Icon as={MapPin} boxSize={5} mr={2} color="blue.500" mt={1} />
        <Box>
          <Text fontWeight="medium">
            {session.venue?.name || session.location}
          </Text>
          {session.venue?.address &&
            session.venue.address !== session.venue.name && (
              <Text fontSize="xs" color="gray.500">
                {session.venue.address}
              </Text>
            )}
        </Box>
      </Flex>
    ) : null;

  const shareButton = (
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
  );

  const callButton = session.hostPhone ? (
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
    >
      {userRegistrationStatus === 'APPROVED'
        ? t('registrationApproved')
        : userRegistrationStatus === 'PENDING'
          ? t('registrationPending')
          : t('registrationRejected')}
    </Badge>
  ) : null;

  // Action buttons
  const actions = (
    <Flex direction="column" gap={2} width="full">
      {/* Registration status badge - right-aligned above buttons */}
      {userRegistrationStatus && (
        <Flex justify="flex-end">
          {registrationStatusBadge}
        </Flex>
      )}

      {/* Action buttons row */}
      <Flex gap={2} flexWrap="wrap" justify="flex-end">
        {shareButton}
        {callButton}

        {/* If user owns the session, show Host button */}
        {isOwner ? (
          <NextLinkButton
            href={
              user.role === 'PLAYER'
                ? `/player/sessions/${session.id}`
                : `/host/sessions/${session.id}`
            }
            colorPalette="blue"
            size="sm"
          >
            {t('host')}
          </NextLinkButton>
        ) : (
          /* Otherwise show registration buttons based on status */
          <>
            {/* View Registration button - show for all registration statuses */}
            {userRegistrationStatus && (
              <Button
                colorPalette="blue"
                variant="outline"
                onClick={onOpenViewRegistrationModal}
                size="sm"
              >
                {t('viewMyRegistration')}
              </Button>
            )}
            {userRegistrationStatus === 'APPROVED' && (
              <NextLinkButton
                href={`/player/sessions/${session.id}`}
                colorPalette="green"
                size="sm"
              >
                {t('viewSession')}
              </NextLinkButton>
            )}
            {!userRegistrationStatus && !isJoined && (
              <Button
                colorPalette="blue"
                onClick={() => {
                  if (!user) {
                    onOpenLoginModal();
                    return;
                  }
                  onJoin();
                }}
                size="sm"
                disabled={isFull}
              >
                {isFull ? t('sessionFull') : t('register')}
              </Button>
            )}
          </>
        )}
      </Flex>
    </Flex>
  );

  return (
    <>
      <BaseSessionCard
        session={session}
        extraInfoRows={locationRow}
        actionButtons={actions}
      />

      {/* Login prompt modal */}
      <LoginPromptModal
        isOpen={isLoginModalOpen}
        onClose={onCloseLoginModal}
        returnUrl={`/browse/sessions?sessionId=${session.id}`}
      />

      {/* Withdraw confirmation modal */}
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
    </>
  );
};

export default FindSessionCard;
