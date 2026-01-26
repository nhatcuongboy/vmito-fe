'use client';

import { ISession } from '@/lib/api/types';
import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import BaseSessionCard from './BaseSessionCard';
import React from 'react';

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

  // Action buttons (unique to FindSessionCard)
  const actions = (
    <Flex gap={2}>
      {callButton}
      {!isJoined && (<Button colorPalette="blue" onClick={onJoin} size="sm">
        {t('register')}
      </Button>)}
      {/* {isJoined ? (
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
      )} */}
    </Flex>
  );

  return (
    <BaseSessionCard
      session={session}
      extraInfoRows={locationRow}
      actionButtons={actions}
    />
  );
};

export default FindSessionCard;
