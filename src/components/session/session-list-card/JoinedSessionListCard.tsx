'use client';

import { Badge, Flex, Icon } from '@chakra-ui/react';
import {
  Check,
  ClipboardCheck,
  ClipboardList,
  Clock,
  LogIn,
  Share2,
  UserPlus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ISession, SessionStatus } from '@/lib/api/types';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { Button } from '@/components/ui/chakra-compat';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { toaster } from '@/components/ui/toaster';
import { useModal } from '@/components/ui/VModal';
import MyRegistrationModal from '../MyRegistrationModal';
import { SessionListCard } from './SessionListCard';
import {
  SessionListCardActionItem,
  SessionListCardActionMenu,
} from './SessionListCardActionMenu';
import { SessionListCardHostRow } from './SessionListCardHostRow';
import { shareSession } from './shareSession';
import { useSessionListCardViewModel } from './useSessionListCardViewModel';

interface JoinedSessionListCardProps {
  session: ISession;
  onAddGuest?: (session: ISession) => void;
  onRefresh?: () => void | Promise<void>;
  imagePriority?: boolean;
}

export const JoinedSessionListCard = ({
  session,
  onAddGuest,
  onRefresh,
  imagePriority = false,
}: JoinedSessionListCardProps) => {
  const t = useTranslations('session');
  const viewModel = useSessionListCardViewModel(session);
  const registrationModal = useModal();
  const registrationStatus = session.players?.[0]?.registrationStatus;
  const detailHref = `/sessions/${session.slug || session.id}`;
  const viewSessionHref = `/player/sessions/${session.slug || session.id}`;

  const registrationBadge = (() => {
    if (registrationStatus === 'APPROVED') {
      return (
        <Badge colorPalette="green" gap={1}>
          <Icon as={Check} boxSize={3} />
          {t('registrationApproved')}
        </Badge>
      );
    }
    if (registrationStatus === 'PENDING') {
      return (
        <Badge colorPalette="yellow" gap={1}>
          <Icon as={Clock} boxSize={3} />
          {t('registrationPending')}
        </Badge>
      );
    }
    if (registrationStatus === 'REJECTED') {
      return (
        <Badge colorPalette="red" gap={1}>
          <Icon as={ClipboardCheck} boxSize={3} />
          {t('registrationRejected')}
        </Badge>
      );
    }
    return null;
  })();

  const sessionStatusBadge = (() => {
    if (viewModel.isExpired) {
      return <Badge colorPalette="orange">{t('status.expired')}</Badge>;
    }

    const config = {
      [SessionStatus.PREPARING]: ['gray', t('status.preparing')],
      [SessionStatus.IN_PROGRESS]: ['teal', t('status.inProgress')],
      [SessionStatus.FINISHED]: ['gray', t('status.finished')],
      [SessionStatus.CANCELLED]: ['red', t('status.cancelled')],
    } as const;
    const [colorPalette, label] = config[session.status];
    return <Badge colorPalette={colorPalette}>{label}</Badge>;
  })();

  // Approval status sits at the top-left; the session status badge stays at the
  // bottom of the cover.
  const overlayBadge = registrationBadge ?? sessionStatusBadge;
  const bottomOverlayBadge = registrationBadge ? sessionStatusBadge : null;

  const isRegistrationPrimary =
    registrationStatus === 'PENDING' || registrationStatus === 'REJECTED';
  const menuItems: SessionListCardActionItem[] = [];

  if (!isRegistrationPrimary && session.players?.[0]) {
    menuItems.push({
      key: 'registration',
      label: t('viewMyRegistration'),
      icon: ClipboardList,
      onSelect: registrationModal.onOpen,
    });
  }
  if (session.players?.[0] && onAddGuest && !viewModel.isFull) {
    menuItems.push({
      key: 'add-guest',
      label: t('addGuest'),
      icon: UserPlus,
      onSelect: () => onAddGuest(session),
    });
  }
  menuItems.push({
    key: 'share',
    label: t('shareSession'),
    icon: Share2,
    onSelect: () =>
      shareSession(session, t('checkOutThisSession'), () =>
        toaster.success({ title: t('linkCopied') })
      ),
  });

  return (
    <>
      <SessionListCard
        session={session}
        href={detailHref}
        imagePriority={imagePriority}
        overlayBadge={overlayBadge}
        bottomOverlayBadge={bottomOverlayBadge}
        identityRow={<SessionListCardHostRow session={session} />}
        cornerAction={
          <FavoriteButton
            type="SESSION"
            targetId={session.id}
            isFavorite={session.isFavorite}
            size="sm"
            variant={{ base: 'ghost', md: 'overlay' }}
            returnUrl={detailHref}
          />
        }
        actionFooter={
          <>
            {isRegistrationPrimary ? (
              <Button
                size="sm"
                minH={{ base: '40px', md: '36px' }}
                px={{ base: 4, md: 3 }}
                colorPalette="green"
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  registrationModal.onOpen();
                }}
              >
                <Icon as={ClipboardList} boxSize={{ base: 4, md: 3.5 }} />
                {t('viewMyRegistration')}
              </Button>
            ) : (
              <NextLinkButton
                href={viewSessionHref}
                size="sm"
                minH={{ base: '40px', md: '36px' }}
                px={{ base: 4, md: 3 }}
                colorPalette="green"
              >
                <Icon as={LogIn} boxSize={{ base: 4, md: 3.5 }} />
                {t('viewSession')}
              </NextLinkButton>
            )}
            <SessionListCardActionMenu
              ariaLabel={t('moreActions')}
              items={menuItems}
            />
          </>
        }
      />

      <MyRegistrationModal
        isOpen={registrationModal.isOpen}
        onClose={registrationModal.onClose}
        session={session}
        onWithdraw={() => {
          registrationModal.onClose();
          void onRefresh?.();
        }}
      />
    </>
  );
};
