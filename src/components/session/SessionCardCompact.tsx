'use client';

import { memo } from 'react';
import { Badge, Icon } from '@chakra-ui/react';
import { Facebook } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { SessionListCard } from './session-list-card/SessionListCard';
import { SessionListCardHostRow } from './session-list-card/SessionListCardHostRow';
import { useSessionListCardViewModel } from './session-list-card/useSessionListCardViewModel';

interface SessionCardCompactProps {
  session: ISession;
  userRegistrationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  distance?: number;
  imagePriority?: boolean;
}

const SessionCardCompact = ({
  session,
  userRegistrationStatus = null,
  distance,
  imagePriority = false,
}: SessionCardCompactProps) => {
  const t = useTranslations('session');
  const viewModel = useSessionListCardViewModel(session, distance);
  const cardHref = `/sessions/${session.slug || session.id}`;

  const overlayBadge = (() => {
    if (userRegistrationStatus) {
      return (
        <Badge
          colorPalette={
            userRegistrationStatus === 'REJECTED' ? 'red' : 'yellow'
          }
          variant={userRegistrationStatus === 'APPROVED' ? 'subtle' : 'solid'}
          borderWidth="1px"
          borderColor={
            userRegistrationStatus === 'APPROVED'
              ? 'yellow.200'
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
      );
    }

    if (viewModel.isCrawled) {
      return (
        <Badge
          bg="blackAlpha.600"
          _dark={{ bg: 'whiteAlpha.200' }}
          color="white"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(4px)"
          gap={1}
          px={1.5}
          whiteSpace="nowrap"
        >
          <Icon as={Facebook} boxSize={3} flexShrink={0} />
          {t('crawledBadge')}
        </Badge>
      );
    }

    if (viewModel.isExpired) return null;

    return (
      <Badge
        colorPalette={viewModel.isFull ? 'gray' : 'teal'}
        variant="solid"
        borderWidth="1px"
        borderColor={viewModel.isFull ? 'gray.400' : 'teal.400'}
      >
        {viewModel.isFull
          ? t('slotsFull')
          : t('slotsAvailable', { count: viewModel.availableSlots })}
      </Badge>
    );
  })();

  return (
    <SessionListCard
      session={session}
      href={cardHref}
      distance={distance}
      imagePriority={imagePriority}
      overlayBadge={overlayBadge}
      identityRow={<SessionListCardHostRow session={session} />}
      cornerAction={
        <FavoriteButton
          type="SESSION"
          targetId={session.id}
          isFavorite={session.isFavorite}
          size="sm"
          variant={{ base: 'ghost', md: 'overlay' }}
          returnUrl={cardHref}
        />
      }
    />
  );
};

export default memo(SessionCardCompact);
