'use client';

import { Box, Table, Text, Heading, Badge, Flex, Icon } from '@chakra-ui/react';
import { Player } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { useLevelLabel } from '@/hooks/useLevelLabel';

interface OverviewPlayerTableProps {
  players: Player[];
}

export default function OverviewPlayerTable({
  players,
}: OverviewPlayerTableProps) {
  const t = useTranslations('common');
  const sessionT = useTranslations('SessionDetail');
  const joinStatusT = useTranslations('pages.join.status');
  const { getLevelShortLabel } = useLevelLabel();

  // Helper to get status badge color
  const getStatusColorScheme = (status: string) => {
    switch (status) {
      case 'PLAYING':
        return 'green';
      case 'WAITING':
        return 'orange';
      case 'READY':
        return 'brand';
      case 'FINISHED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PLAYING':
        return joinStatusT('playing.title');
      case 'WAITING':
        return joinStatusT('waiting.title');
      case 'READY':
        return joinStatusT('ready.title');
      case 'FINISHED':
        return joinStatusT('finished.title');
      default:
        return status;
    }
  };

  // Sort players: Playing -> Ready -> Waiting -> Others
  const sortedPlayers = [...(players || [])].sort((a, b) => {
    const statusOrder = {
      PLAYING: 1,
      READY: 2,
      WAITING: 3,
      FINISHED: 4,
      INACTIVE: 5,
    };

    // Sort by status priority
    const statusDiff =
      (statusOrder[a.status as keyof typeof statusOrder] || 99) -
      (statusOrder[b.status as keyof typeof statusOrder] || 99);
    if (statusDiff !== 0) return statusDiff;

    // Then sort by player number
    return a.playerNumber - b.playerNumber;
  });

  return (
    <Box
      mt={6}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="xl"
      shadow="sm"
      border="1px solid"
      borderColor="gray.100"
      overflow="hidden"
    >
      <Flex
        align="center"
        p={4}
        borderBottom="1px solid"
        borderColor="gray.100"
        _dark={{ borderColor: 'gray.700' }}
      >
        <Icon as={Users} boxSize={5} mr={2} color="green.500" />
        <Heading
          size="sm"
          fontSize="md"
          color="gray.700"
          _dark={{ color: 'gray.200' }}
        >
          {sessionT('playersTab.players')} ({players?.length || 0})
        </Heading>
      </Flex>

      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline" colorPalette="gray">
          <Table.Header bg="gray.50" _dark={{ bg: 'gray.700' }}>
            <Table.Row>
              <Table.ColumnHeader width="60px" py={3} ps={4}>
                #
              </Table.ColumnHeader>
              <Table.ColumnHeader py={3}>{t('playerName')}</Table.ColumnHeader>
              <Table.ColumnHeader py={3} textAlign="center">
                {t('level')}
              </Table.ColumnHeader>
              <Table.ColumnHeader py={3} textAlign="center">
                {t('status')}
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {!sortedPlayers || sortedPlayers.length === 0 ? (
              <Table.Row>
                <Table.Cell
                  colSpan={4}
                  textAlign="center"
                  py={6}
                  color="gray.500"
                >
                  {sessionT('noPlayersAvailable')}
                </Table.Cell>
              </Table.Row>
            ) : (
              sortedPlayers.map((player) => (
                <Table.Row
                  key={player.id}
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                  transition="background 0.2s"
                >
                  <Table.Cell
                    py={3}
                    ps={4}
                    fontWeight="medium"
                    color="gray.500"
                  >
                    {player.playerNumber}
                  </Table.Cell>
                  <Table.Cell py={3} fontWeight="medium">
                    {player.name}
                  </Table.Cell>
                  <Table.Cell py={3} textAlign="center">
                    {player.level ? (
                      <Badge
                        colorPalette="green"
                        variant="subtle"
                        px={2}
                        borderRadius="full"
                      >
                        {getLevelShortLabel(player.level)}
                      </Badge>
                    ) : (
                      <Text fontSize="sm" color="gray.400">
                        -
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell py={3} textAlign="center">
                    <Badge
                      colorPalette={getStatusColorScheme(player.status)}
                      variant="subtle"
                      px={2}
                      borderRadius="md"
                    >
                      {getStatusLabel(player.status)}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}
