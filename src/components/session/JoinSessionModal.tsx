'use client';

import { PlayerService } from '@/lib/api/player.service';
import { ISession, Player } from '@/lib/api/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { Box, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, ChangeEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  IconButton,
  Divider,
} from '@/components/ui/chakra-compat';
import { CommonModal } from '@/components/ui/CommonModal';

interface JoinSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
  onSuccess?: () => void;
}

interface RegisterPlayerInput {
  name: string;
  level: number;
  isMe: boolean;
}

export default function JoinSessionModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: JoinSessionModalProps) {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const [players, setPlayers] = useState<RegisterPlayerInput[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with "Me"
  useEffect(() => {
    if (isOpen) {
      setPlayers([
        {
          name: user?.name || '',
          level: 1, // Default level
          isMe: true,
        },
      ]);
    }
  }, [isOpen, user]);

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
      onClose();
    } catch (error) {
      console.error(error);
      // toaster handled in service
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('joinSession')}: ${session.name}`}
      primaryActionText={t('submitRegistration')}
      onPrimaryAction={handleSubmit}
      isPrimaryLoading={loading}
      secondaryActionText={tCommon('cancel')}
      size="lg"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="sm" color="gray.500">
          {t('joinSessionDescription', { hostName: session.host?.name || '' })}
        </Text>

        {session.requiredLevels && session.requiredLevels.length > 0 && (
          <Box bg="blue.50" p={2} borderRadius="md">
            <Text fontSize="sm" color="blue.700">
              {t('requiredLevels')}:{' '}
              {session.requiredLevels.map((l) => t(`levels.${l}`)).join(', ')}
            </Text>
          </Box>
        )}

        <Divider />

        {players.map((player, index) => (
          <Box
            key={index}
            p={3}
            borderWidth="1px"
            borderRadius="md"
            position="relative"
          >
            {/* Remove button for guests */}
            {!player.isMe && (
              <Box position="absolute" top={2} right={2}>
                <IconButton
                  aria-label="Remove"
                  icon={<Trash2 size={16} />}
                  size="xs"
                  // colorScheme="red" - removed as it might not be supported in compat if basic
                  onClick={() => handleRemovePlayer(index)}
                />
              </Box>
            )}

            <VStack spacing={3}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">
                  {player.isMe ? t('myName') : t('guestName')}
                </FormLabel>
                <Input
                  value={player.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleUpdatePlayer(index, 'name', e.target.value)
                  }
                  placeholder={t('enterName')}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">{t('level')}</FormLabel>
                <Select
                  value={player.level}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    handleUpdatePlayer(index, 'level', parseInt(e.target.value))
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                    <option key={l} value={l}>
                      {t(`levels.${l}`)}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </Box>
        ))}

        <Button
          leftIcon={<Plus size={16} />}
          variant="outline"
          size="sm"
          onClick={handleAddPlayer}
        >
          {t('addGuest')}
        </Button>
      </VStack>
    </CommonModal>
  );
}
