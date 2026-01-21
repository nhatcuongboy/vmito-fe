import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import {
  Button,
  Card,
  CardBody,
  VStack,
  HStack,
} from '@/components/ui/chakra-compat';
import { Plus, Users, UserPlus } from 'lucide-react';
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
  onUpdateEditingPlayer: (
    playerId: string,
    field: string,
    value: string | boolean
  ) => void;
  onDeletePlayer: (playerId: string) => void;
  onShowQR: (player: Player) => void;
  isFiltered?: boolean; // true when filter is applied (not 'ALL')
  filterName?: string; // translated name of current filter for empty state message
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
  isFiltered = false,
  filterName,
}) => {
  const t = useTranslations('pages.playerManagement');

  return (
    <Box>
      <VStack spacing={5} align="stretch">
        {/* Player list or empty state */}
        {players.length === 0 ? (
          <Card 
            variant="outline" 
            bg="linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)" 
            borderStyle="dashed"
            borderWidth="2px"
            borderColor="gray.200"
            borderRadius="2xl"
          >
            <CardBody p={{ base: 8, md: 12 }}>
              <VStack spacing={6}>
                {/* Empty state icon */}
                <Flex
                  width="80px"
                  height="80px"
                  borderRadius="2xl"
                  bg="white"
                  align="center"
                  justify="center"
                  boxShadow="0 4px 20px rgba(0,0,0,0.08)"
                  border="1px solid"
                  borderColor="gray.100"
                >
                  <Box as={Users} boxSize={10} color="gray.400" />
                </Flex>
                
                <VStack spacing={2}>
                  <Text 
                    fontSize="xl" 
                    fontWeight="bold" 
                    color="gray.700"
                    letterSpacing="-0.01em"
                  >
                    {isFiltered ? t('noPlayersWithFilter') : t('noPlayersYet')}
                  </Text>
                  <Text 
                    fontSize="sm" 
                    color="gray.500" 
                    textAlign="center"
                    maxW="300px"
                    lineHeight="1.6"
                  >
                    {isFiltered 
                      ? t('noPlayersWithFilterDescription', { status: filterName || '' })
                      : t('noPlayersYetDescription')}
                  </Text>
                </VStack>
                
                {/* Only show Add Player button when not filtered */}
                {!isFiltered && (
                  <Button
                    size="lg"
                    leftIcon={<Box as={UserPlus} boxSize={5} />}
                    onClick={onAddNewPlayer}
                    colorScheme="green"
                    borderRadius="xl"
                    px={8}
                    boxShadow="0 4px 14px rgba(72, 187, 120, 0.3)"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(72, 187, 120, 0.4)',
                    }}
                    transition="all 0.2s"
                  >
                    {t('addFirstPlayer')}
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={0} align="stretch">
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
    </Box>
  );
};

export default PlayerList;
