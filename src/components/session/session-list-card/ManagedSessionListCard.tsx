'use client';

import { useState } from 'react';
import { Badge, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Download,
  LayoutGrid,
  Play,
  Settings,
  Share2,
  Square,
  Trash2,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ISession, SessionStatus } from '@/lib/api/types';
import { SessionService } from '@/lib/api/session.service';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { VModal, useModal } from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';
import SessionShareImageModal from '../SessionShareImageModal';
import { SessionListCard } from './SessionListCard';
import {
  SessionListCardActionItem,
  SessionListCardActionMenu,
} from './SessionListCardActionMenu';
import { shareSession } from './shareSession';
import { useSessionListCardViewModel } from './useSessionListCardViewModel';

interface ManagedSessionListCardProps {
  session: ISession;
  onDelete: (id: string) => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  imagePriority?: boolean;
}

export const ManagedSessionListCard = ({
  session,
  onDelete,
  onRefresh,
  imagePriority = false,
}: ManagedSessionListCardProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const viewModel = useSessionListCardViewModel(session);
  const [isMutating, setIsMutating] = useState(false);
  const [isShareImageOpen, setIsShareImageOpen] = useState(false);
  const deleteModal = useModal();
  const endModal = useModal();
  const detailHref = `/sessions/${session.slug || session.id}`;
  const manageHref = `/host/sessions/${session.slug || session.id}`;

  const handleMutation = async (mutation: () => Promise<unknown>) => {
    try {
      setIsMutating(true);
      await mutation();
      await onRefresh?.();
      return true;
    } catch (error) {
      console.error('Error updating session status:', error);
      toaster.error({ title: t('errorUpdatingSessionStatus') });
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const handleStart = async () => {
    const isSuccessful = await handleMutation(() =>
      SessionService.startSession(session.id)
    );
    if (isSuccessful) toaster.success({ title: t('sessionStarted') });
  };

  const handleEnd = async () => {
    endModal.onClose();
    const isSuccessful = await handleMutation(() =>
      SessionService.endSession(session.id)
    );
    if (isSuccessful) toaster.success({ title: t('sessionEnded') });
  };

  const handleDelete = async () => {
    deleteModal.onClose();
    await onDelete(session.id);
  };

  const statusBadge = (() => {
    if (viewModel.isExpired) {
      return <Badge colorPalette="orange">{t('status.expired')}</Badge>;
    }

    const config = {
      [SessionStatus.PREPARING]: ['green', t('status.preparing')],
      [SessionStatus.IN_PROGRESS]: ['teal', t('status.inProgress')],
      [SessionStatus.FINISHED]: ['gray', t('status.finished')],
      [SessionStatus.CANCELLED]: ['red', t('status.cancelled')],
    } as const;
    const [colorPalette, label] = config[session.status];
    return <Badge colorPalette={colorPalette}>{label}</Badge>;
  })();

  const menuItems: SessionListCardActionItem[] = [];
  if (session.status === SessionStatus.PREPARING && !viewModel.isExpired) {
    menuItems.push({
      key: 'start',
      label: t('startSession'),
      icon: Play,
      color: 'green.600',
      onSelect: handleStart,
    });
  }
  if (session.status === SessionStatus.IN_PROGRESS) {
    menuItems.push({
      key: 'end',
      label: t('endSession'),
      icon: Square,
      color: 'orange.600',
      onSelect: endModal.onOpen,
    });
  }
  menuItems.push(
    {
      key: 'download',
      label: t('downloadImage'),
      icon: Download,
      onSelect: () => setIsShareImageOpen(true),
    },
    {
      key: 'share',
      label: t('shareSession'),
      icon: Share2,
      onSelect: () =>
        shareSession(session, t('checkOutThisSession'), () =>
          toaster.success({ title: t('linkCopied') })
        ),
    },
    {
      key: 'delete',
      label: t('deleteSession'),
      icon: Trash2,
      color: 'red.600',
      onSelect: deleteModal.onOpen,
    }
  );

  return (
    <>
      <SessionListCard
        session={session}
        href={detailHref}
        imagePriority={imagePriority}
        overlayBadge={statusBadge}
        identityRow={
          <Flex align="center" gap={2} color="fg.muted" minW={0}>
            <Icon as={Users} boxSize={3.5} flexShrink={0} />
            <Text fontSize={{ base: 'xs', md: 'sm' }} whiteSpace="nowrap">
              {t('playersCount', { count: viewModel.approvedPlayersCount })}/
              {viewModel.maxPlayers}
            </Text>
            <Text color="gray.300">•</Text>
            <Icon as={LayoutGrid} boxSize={3.5} flexShrink={0} />
            <Text fontSize={{ base: 'xs', md: 'sm' }} whiteSpace="nowrap">
              {session.numberOfCourts} {t('courtsAvailable')}
            </Text>
          </Flex>
        }
        actionFooter={
          <>
            <NextLinkButton
              href={manageHref}
              size="sm"
              minH={{ base: '40px', md: '36px' }}
              px={{ base: 4, md: 3 }}
              colorPalette="green"
            >
              <Icon as={Settings} boxSize={{ base: 4, md: 3.5 }} />
              {t('manageSession')}
            </NextLinkButton>
            <SessionListCardActionMenu
              ariaLabel={t('moreActions')}
              items={menuItems}
              isLoading={isMutating}
            />
          </>
        }
      />

      <VModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        title={t('deleteSession')}
        primaryActionText={tCommon('delete')}
        secondaryActionText={tCommon('cancel')}
        primaryColorScheme="red"
        onPrimaryAction={handleDelete}
      >
        <Text>{t('deleteConfirmation')}</Text>
      </VModal>

      <VModal
        isOpen={endModal.isOpen}
        onClose={endModal.onClose}
        title={t('confirmEndSession')}
        primaryActionText={t('endSession')}
        secondaryActionText={tCommon('cancel')}
        primaryColorScheme="orange"
        isPrimaryLoading={isMutating}
        onPrimaryAction={handleEnd}
      >
        <Text>{t('confirmEndSessionMessage')}</Text>
      </VModal>

      <SessionShareImageModal
        isOpen={isShareImageOpen}
        onClose={() => setIsShareImageOpen(false)}
        session={session}
      />
    </>
  );
};
