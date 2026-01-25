import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { PlayerService } from '@/lib/api/player.service';
import { ISession, Player } from '@/lib/api/types';

export interface RegisterPlayerInput {
  name: string;
  level: number;
  isMe: boolean;
}

interface UseJoinSessionProps {
  session: ISession | null; // Allow null to handle loading states in parent gracefully
  isOpen?: boolean; // Optional, to trigger initialization effects
  onSuccess?: () => void;
}

export function useJoinSession({ session, isOpen = true, onSuccess }: UseJoinSessionProps) {
  const { user } = useAuthStore();
  const [players, setPlayers] = useState<RegisterPlayerInput[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with "Me" when session/user/isOpen changes
  useEffect(() => {
    if (isOpen && session) {
      setPlayers([
        {
          name: user?.name || '',
          level: 1, // Default level
          isMe: true,
        },
      ]);
    }
  }, [isOpen, user, session]);

  const handleAddPlayer = () => {
    setPlayers((prev) => [...prev, { name: '', level: 1, isMe: false }]);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePlayer = (
    index: number,
    field: 'name' | 'level',
    value: string | number
  ) => {
    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], [field]: value };
      return newPlayers;
    });
  };

  const handleSubmit = async () => {
    if (!session) return;
    
    try {
      setLoading(true);

      const playersDto: Partial<Player>[] = players.map((p, index) => ({
        playerNumber: (session._count?.players || 0) + 1 + index,
        name: p.name,
        level: p.level,
        userId: p.isMe ? user?.id : undefined,
      }));

      await PlayerService.registerPlayers(session.id, playersDto);

      onSuccess?.();
    } catch (error) {
      console.error(error);
      // toaster handled in service usually, but we might want to ensure it is
    } finally {
      setLoading(false);
    }
  };

  return {
    players,
    loading,
    setPlayers, // Exposed if needed
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleSubmit,
  };
}
