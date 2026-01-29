'use client';

import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { ISession } from '@/lib/api/types';
import { Box, Text, Icon, Flex, Badge, Stack } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { Share2, MapPin } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { CommonModal, useModal } from '@/components/ui/CommonModal';
import BaseSessionCard from './BaseSessionCard';
import { useAuthStore } from '@/stores/useAuthStore';
import { toaster } from '@/components/ui/toaster';

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

  const { isOpen, onOpen, onClose } = useModal();

  // Check if current user is the session owner
  const isOwner = session.hostId === user?.id;

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/sessions/${session.id}`;

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

  // Action buttons - route owners to manage page, others to view page
  const actions = (
    <Stack gap={2} align="flex-end">
      {/* Row 1: Share */}
      <Flex justify="flex-end">
        <IconButton
          size="sm"
          colorPalette="gray"
          variant="outline"
          aria-label="Share session"
          icon={<Icon as={Share2} />}
          onClick={handleShare}
        />
      </Flex>

      {/* Row 2: Management/View */}
      <Flex gap={2} flexWrap="wrap" justify="flex-end">
        {mode === 'manage' || (isOwner && user?.role !== 'PLAYER') ? (
          <NextLinkButton
            href={`/host/sessions/${session.id}`}
            colorPalette="blue"
            size="sm"
          >
            {t('manageSession')}
          </NextLinkButton>
        ) : (
          <NextLinkButton
            href={`/player/sessions/${session.id}`}
            colorPalette={isOwner && user?.role === 'PLAYER' ? 'blue' : 'blue'}
            size="sm"
          >
            {isOwner && user?.role === 'PLAYER' ? t('manageSession') : t('viewSession')}
          </NextLinkButton>
        )}
        {mode === 'manage' && onDelete && (
          <Button
            colorPalette="red"
            variant="outline"
            size="sm"
            onClick={onOpen}
          >
            {t('deleteSession')}
          </Button>
        )}
      </Flex>
    </Stack>
  );

  // Delete modal (unique to SessionCard)
  const modal = onDelete ? (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('deleteSession')}
      primaryActionText={tCommon('delete')}
      secondaryActionText={tCommon('cancel')}
      onPrimaryAction={() => {
        onDelete(session.id);
        onClose();
      }}
      primaryColorScheme="red"
    >
      <Text>{t('deleteConfirmation')}</Text>
    </CommonModal>
  ) : null;

  return (
    <BaseSessionCard
      session={session}
      registrationBadgeContent={registrationBadge}
      extraInfoRows={locationRow}
      actionButtons={actions}
      modalContent={modal}
    />
  );
};

export default SessionCard;

