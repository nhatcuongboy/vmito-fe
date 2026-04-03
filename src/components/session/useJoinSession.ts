import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { PlayerService } from '@/lib/api/player.service';
import { GenderType, ISession, Player } from '@/lib/api/types';
import { useTranslations } from 'next-intl';
import { toaster } from '@/components/ui/toaster';

export interface RegisterPlayerInput {
  name: string;
  phone?: string;
  gender: GenderType;
  level: number;
  levelDescription: string;
  isMe: boolean;
}

export interface ValidationErrors {
  [index: number]: {
    name?: string;
    phone?: string;
    level?: string;
  };
}

interface UseJoinSessionProps {
  session: ISession | null; // Allow null to handle loading states in parent gracefully
  isOpen?: boolean; // Optional, to trigger initialization effects
  onSuccess?: () => void;
}

export function useJoinSession({
  session,
  isOpen = true,
  onSuccess,
}: UseJoinSessionProps) {
  const { user } = useAuthStore();
  const t = useTranslations('session');
  const [players, setPlayers] = useState<RegisterPlayerInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Get default level based on session's required levels
  const getDefaultLevel = useCallback((): number => {
    if (session?.requiredLevels && session.requiredLevels.length > 0) {
      return session.requiredLevels[0];
    }
    return 0; // 0 means not selected
  }, [session?.requiredLevels]);

  // Initialize with "Me" when session/user/isOpen changes
  useEffect(() => {
    if (isOpen && session) {
      setPlayers([
        {
          name: user?.name || '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          phone: (user as any)?.phone || '',
          gender: 'MALE',
          level: getDefaultLevel(),
          levelDescription: '',
          isMe: true,
        },
      ]);
      setErrors({});
    }
  }, [isOpen, user, session, getDefaultLevel]);

  const handleAddPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        name: '',
        phone: '',
        gender: 'MALE',
        level: getDefaultLevel(),
        levelDescription: '',
        isMe: false,
      },
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
    // Clear errors for removed player
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      // Re-index remaining errors
      const reindexed: ValidationErrors = {};
      Object.entries(newErrors).forEach(([key, value]) => {
        const numKey = parseInt(key);
        if (numKey > index) {
          reindexed[numKey - 1] = value;
        } else {
          reindexed[numKey] = value;
        }
      });
      return reindexed;
    });
  };

  const handleUpdatePlayer = (
    index: number,
    field: keyof Omit<RegisterPlayerInput, 'isMe'>,
    value: string | number
  ) => {
    setPlayers((prev) => {
      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], [field]: value };
      return newPlayers;
    });
    // Clear error for this field
    if (errors[index]?.[field as 'name' | 'level']) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[index]) {
          delete newErrors[index][field as 'name' | 'level'];
          if (Object.keys(newErrors[index]).length === 0) {
            delete newErrors[index];
          }
        }
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    players.forEach((player, index) => {
      const playerErrors: { name?: string; level?: string } = {};

      // Validate name
      if (!player.name.trim()) {
        playerErrors.name = 'required';
        isValid = false;
      }

      // Validate level
      if (!player.level || player.level === 0) {
        playerErrors.level = 'required';
        isValid = false;
      }

      if (Object.keys(playerErrors).length > 0) {
        newErrors[index] = playerErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!session) return;

    // Validate before submit
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const playersDto: Partial<Player>[] = players.map((p, index) => ({
        playerNumber: (session._count?.players || 0) + 1 + index,
        name: p.name.trim(),
        phone: p.phone?.trim(),
        gender: p.gender,
        level: p.level,
        levelDescription: p.levelDescription.trim() || undefined,
        userId: p.isMe ? user?.id : undefined,
      }));

      await PlayerService.registerPlayers(session.id, playersDto);
      toaster.success({
        title: t('registrationSuccessPending') || 'Registration request sent',
      });

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
    errors,
    setPlayers, // Exposed if needed
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleSubmit,
    validate,
  };
}
