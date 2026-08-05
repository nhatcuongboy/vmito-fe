import { Box } from '@chakra-ui/react';
import { SimpleGrid } from '@/components/ui/chakra-compat';
import React from 'react';
import PlayerEmptyState from './PlayerEmptyState';
import PlayerListItem from './PlayerListItem';
import { Player } from './types';

interface PlayerListProps {
  players: Player[];
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onTogglePlayerStatus: (playerId: string) => void;
  onShowQR: (player: Player) => void;
  isFiltered?: boolean; // true when filter is applied (not 'ALL')
  filterName?: string; // translated name of current filter for empty state message
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onEditPlayer,
  onDeletePlayer,
  onTogglePlayerStatus,
  onShowQR,
  isFiltered = false,
  filterName,
}) => {
  return (
    <Box>
      {/* Player list or empty state */}
      {players.length === 0 ? (
        <PlayerEmptyState isFiltered={isFiltered} filterName={filterName} />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
          {players
            .sort((a, b) => a.playerNumber - b.playerNumber)
            .map((player) => (
              <PlayerListItem
                key={player.id}
                player={player}
                onEdit={onEditPlayer}
                onDelete={onDeletePlayer}
                onToggleStatus={onTogglePlayerStatus}
                onShowQR={onShowQR}
              />
            ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default PlayerList;
