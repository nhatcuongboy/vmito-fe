import { Button, Divider, FormControl, FormLabel, IconButton, Input, Select, VStack } from '@/components/ui/chakra-compat';
import { VALID_LEVELS } from '@/constants/levels';
import { ISession } from '@/lib/api/types';
import { Box, Text } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChangeEvent, useMemo } from 'react';
import { RegisterPlayerInput } from './useJoinSession';

interface JoinSessionFormProps {
  session: ISession;
  players: RegisterPlayerInput[];
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  onUpdatePlayer: (index: number, field: 'name' | 'level', value: string | number) => void;
}

export default function JoinSessionForm({
  session,
  players,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
}: JoinSessionFormProps) {
  const t = useTranslations('session');

  const availableLevels = useMemo(() => {
    if (session.requiredLevels && session.requiredLevels.length > 0) {
      return [...session.requiredLevels].sort((a, b) => a - b);
    }
    return VALID_LEVELS;
  }, [session.requiredLevels]);

  return (
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
                onClick={() => onRemovePlayer(index)}
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
                  onUpdatePlayer(index, 'name', e.target.value)
                }
                placeholder={t('enterName')}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">{t('level')}</FormLabel>
              <Select
                value={player.level}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  onUpdatePlayer(index, 'level', parseInt(e.target.value))
                }
              >
                {availableLevels.map((l) => (
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
        onClick={onAddPlayer}
      >
        {t('addGuest')}
      </Button>
    </VStack>
  );
}
