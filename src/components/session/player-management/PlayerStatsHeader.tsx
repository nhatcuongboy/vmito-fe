import { Badge, Box, Flex, Heading, Text } from '@chakra-ui/react';
import { HStack } from '@/components/ui/chakra-compat';
import { ISession } from '@/lib/api/types';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

interface PlayerStatsHeaderProps {
  session: ISession;
  newPlayersCount: number;
  maxPlayers: number;
}

const PlayerStatsHeader: React.FC<PlayerStatsHeaderProps> = ({
  session,
  newPlayersCount,
  maxPlayers,
}) => {
  const t = useTranslations('pages.playerManagement');
  const currentPlayerCount = (session.players?.length || 0) + newPlayersCount;
  const isMaxPlayersReached = currentPlayerCount >= maxPlayers;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={2}>
        <HStack spacing={3}>
          <Box as={Users} boxSize={5} color="blue.600" />
          <Heading size="md" color="gray.800">
            {t('playerManagementTitle')}
          </Heading>
        </HStack>
        <Badge
          colorPalette={isMaxPlayersReached ? 'red' : 'green'}
          variant="subtle"
          px={3}
          py={1}
          borderRadius="full"
          fontSize="sm"
          fontWeight="semibold"
        >
          {t('playerCount', { current: currentPlayerCount, max: maxPlayers })}
        </Badge>
      </Flex>

      {/* Quick stats */}
      <HStack spacing={6} fontSize="sm" color="gray.600">
        <HStack spacing={1}>
          <Text fontWeight="medium">{session.players?.length || 0}</Text>
          <Text>{t('existing')}</Text>
        </HStack>
        <HStack spacing={1}>
          <Text fontWeight="medium">{newPlayersCount}</Text>
          <Text>{t('new')}</Text>
        </HStack>
        <HStack spacing={1}>
          <Text fontWeight="medium">{session.numberOfCourts}</Text>
          <Text>{t('courts')}</Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export default PlayerStatsHeader;
