'use client';

import { ISession } from '@/lib/api/types';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import BaseSessionCard from './BaseSessionCard';

interface FindSessionCardProps {
  session: ISession;
  onJoin: () => void;
  isJoined?: boolean;
}

const FindSessionCard = ({
  session,
  onJoin,
  isJoined = false,
}: FindSessionCardProps) => {
  const t = useTranslations('session');

  // Location/venue display (unique to FindSessionCard)
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

  // Action buttons (unique to FindSessionCard)
  const actions = isJoined ? (
    <NextLinkButton
      href={`/player/sessions/${session.id}`}
      colorPalette="green"
      size="sm"
    >
      {t('viewSession')}
    </NextLinkButton>
  ) : (
    <Button colorPalette="blue" onClick={onJoin} size="sm">
      {t('register')}
    </Button>
  );

  const callButton = session.hostPhone ? (
    <Button
      size="sm"
      leftIcon={<Icon as={Phone} />}
      colorPalette="green"
      variant="outline"
      onClick={() => window.open(`tel:${session.hostPhone}`)}
    >
      Call
    </Button>
  ) : null;

  return (
    <BaseSessionCard
      session={session}
      extraInfoRows={locationRow}
      actionButtons={actions}
      hostActions={callButton}
    />
  );
};

export default FindSessionCard;
