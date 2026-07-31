'use client';

import { Avatar, Flex, Text } from '@chakra-ui/react';
import { ISession } from '@/lib/api/types';
import { normalizeImageUrl } from '@/lib/images/normalizeImageUrl';
import { AppPlayerRating } from '@/components/rating';

interface SessionListCardHostRowProps {
  session: ISession;
}

export const SessionListCardHostRow = ({
  session,
}: SessionListCardHostRowProps) => {
  const displayHostName = session.hostName || session.host?.name || '';

  if (!displayHostName) return null;

  const isCrawled = session.isCrawled === true;
  const avatarSource = isCrawled
    ? session.externalAuthorAvatar
    : session.host?.image
      ? normalizeImageUrl(session.host.image)
      : undefined;

  return (
    <Flex align="center" gap={1.5} minW={0}>
      <Avatar.Root
        size="2xs"
        bg={isCrawled ? 'blue.500' : 'brand.500'}
        flexShrink={0}
      >
        <Avatar.Fallback name={displayHostName}>
          {displayHostName.charAt(0).toUpperCase()}
        </Avatar.Fallback>
        {avatarSource && <Avatar.Image src={avatarSource} alt="" />}
      </Avatar.Root>
      <Text
        fontSize={{ base: 'xs', md: 'sm' }}
        color="fg.muted"
        lineClamp={1}
        minW={0}
      >
        {displayHostName}
      </Text>
      {!isCrawled && <AppPlayerRating userId={session.hostId} size="xs" />}
    </Flex>
  );
};
