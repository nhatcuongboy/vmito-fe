'use client';

import { memo } from 'react';
import { Badge, Flex, Icon, Text } from '@chakra-ui/react';
import { Check, ClipboardCheck, Clock, Facebook } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ISession } from '@/lib/api/types';
import { SPORT_EMOJI, normalizeSportType } from '@/constants/sports';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { SessionListCard } from './session-list-card/SessionListCard';
import { SessionListCardHostRow } from './session-list-card/SessionListCardHostRow';
import { SessionListCardProgressBar } from './session-list-card/SessionListCardProgressBar';
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
  const sportType = normalizeSportType(session.sportType);

  const sportBadge = (
    <Badge
      variant="plain"
      bg="blackAlpha.600"
      color="white"
      borderRadius="full"
      backdropFilter="blur(8px)"
      gap={1}
      px={{ base: 2.5, md: 3 }}
      py={{ base: 1, md: 1.5 }}
      fontSize={{ base: 'xs', md: 'sm' }}
      fontWeight="medium"
      whiteSpace="nowrap"
    >
      {SPORT_EMOJI[sportType]} {t(`sportBadge.${sportType}`)}
    </Badge>
  );

  const registrationStatusBadge = (() => {
    if (userRegistrationStatus === 'APPROVED') {
      return (
        <Badge colorPalette="green" gap={1}>
          <Icon as={Check} boxSize={3} />
          {t('registrationApproved')}
        </Badge>
      );
    }
    if (userRegistrationStatus === 'PENDING') {
      return (
        <Badge colorPalette="yellow" gap={1}>
          <Icon as={Clock} boxSize={3} />
          {t('registrationPending')}
        </Badge>
      );
    }
    if (userRegistrationStatus === 'REJECTED') {
      return (
        <Badge colorPalette="red" gap={1}>
          <Icon as={ClipboardCheck} boxSize={3} />
          {t('registrationRejected')}
        </Badge>
      );
    }
    return null;
  })();

  const overlayBadge = sportBadge;
  const bottomOverlayBadge = registrationStatusBadge;

  const bottomBar = viewModel.isCrawled ? (
    <Flex
      align="center"
      justify="space-between"
      gap={2}
      mt={{ base: 1, md: 1.5 }}
    >
      <Flex
        align="center"
        gap={1}
        color="gray.500"
        _dark={{ color: 'gray.400' }}
      >
        <Icon as={Facebook} boxSize={{ base: 3, md: 3.5 }} flexShrink={0} />
        <Text fontSize={{ base: 'xs', md: 'sm' }} whiteSpace="nowrap">
          {t('crawledBadge')}
        </Text>
      </Flex>
      <Text fontSize={{ base: 'xs', md: 'sm' }} color="fg.muted" flexShrink={0}>
        {t('courtsLabel', { count: session.numberOfCourts })}
      </Text>
    </Flex>
  ) : (
    <SessionListCardProgressBar
      current={viewModel.approvedPlayersCount}
      total={viewModel.maxPlayers}
      courtsCount={session.numberOfCourts}
    />
  );

  return (
    <SessionListCard
      session={session}
      href={cardHref}
      distance={distance}
      imagePriority={imagePriority}
      overlayBadge={overlayBadge}
      bottomOverlayBadge={bottomOverlayBadge}
      identityRow={<SessionListCardHostRow session={session} />}
      bottomBar={bottomBar}
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
