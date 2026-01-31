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
import PlayerEmptyState from './PlayerEmptyState';
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
  onTogglePlayerStatus: (playerId: string) => void;
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
  onTogglePlayerStatus,
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
          <PlayerEmptyState isFiltered={isFiltered} filterName={filterName} />
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
                  onToggleStatus={onTogglePlayerStatus}
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
