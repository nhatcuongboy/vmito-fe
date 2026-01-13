import {
  Box,
  Flex,
  Heading,
  Text,
} from '@chakra-ui/react';
import { 
  Button, 
  Card, 
  CardBody, 
  VStack, 
  HStack 
} from '@/components/ui/chakra-compat';
import { Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import PlayerListItem from './PlayerListItem';
import { Player } from './types';

interface PlayerListProps {
  players: Player[];
  editingPlayers: { [key: string]: Player };
  availableLevels: number[];
  isSaving: boolean;
  onAddNewPlayer: () => void;
  onEditPlayer: (player: Player) => void;
  onCancelEditPlayer: (playerId: string) => void;
  onSavePlayer: (playerId: string) => void;
  onUpdateEditingPlayer: (playerId: string, field: string, value: string | boolean) => void;
  onDeletePlayer: (playerId: string) => void;
  onShowQR: (player: Player) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  editingPlayers,
  availableLevels,
  isSaving,
  onAddNewPlayer,
  onEditPlayer,
  onCancelEditPlayer,
  onSavePlayer,
  onUpdateEditingPlayer,
  onDeletePlayer,
  onShowQR,
}) => {
  const t = useTranslations('pages.playerManagement');

  return (
    <Card variant="outline">
      <CardBody p={1}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Box as={Users} boxSize={5} color="blue.600" />
              <VStack align="start" spacing={1}>
                <Heading size="sm" color="gray.800">
                  {t('existingPlayers', { count: players.length })}
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  {t('clickEditToModify')}
                </Text>
              </VStack>
            </HStack>
          </Flex>

          {/* Player list or empty state */}
          {players.length === 0 ? (
            <Card variant="outline" bg="gray.50" borderStyle="dashed">
              <CardBody p={8}>
                <VStack spacing={4}>
                  <Box fontSize="4xl">👥</Box>
                  <VStack spacing={2}>
                    <Text fontSize="lg" fontWeight="medium" color="gray.600">
                      {t('noPlayersYet')}
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      {t('noPlayersYetDescription')}
                    </Text>
                  </VStack>
                  <Button
                    size="md"
                    leftIcon={<Box as={Plus} boxSize={4} />}
                    onClick={onAddNewPlayer}
                    colorScheme="green"
                  >
                    {t('addFirstPlayer')}
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <VStack spacing={3}>
              {players
                .sort((a, b) => a.playerNumber - b.playerNumber)
                .map((player) => (
                  <PlayerListItem
                    key={player.id}
                    player={player}
                    isEditing={editingPlayers[player.id]}
                    availableLevels={availableLevels}
                    isSaving={isSaving}
                    onEdit={onEditPlayer}
                    onCancelEdit={onCancelEditPlayer}
                    onSave={onSavePlayer}
                    onUpdateEditing={onUpdateEditingPlayer}
                    onDelete={onDeletePlayer}
                    onShowQR={onShowQR}
                  />
                ))}
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PlayerList;
