import {
  Button,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  VStack,
} from '@/components/ui/chakra-compat';
import { VALID_LEVELS } from '@/constants/levels';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { GenderType, ISession } from '@/lib/api/types';
import { Badge, Box, Flex, Grid, Input, Text, Textarea } from '@chakra-ui/react';
import { Plus, Trash2, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChangeEvent, useMemo } from 'react';
import { RegisterPlayerInput, ValidationErrors } from './useJoinSession';

interface JoinSessionFormProps {
  session: ISession;
  players: RegisterPlayerInput[];
  errors: ValidationErrors;
  onAddPlayer: () => void;
  onRemovePlayer: (index: number) => void;
  onUpdatePlayer: (
    index: number,
    field: keyof Omit<RegisterPlayerInput, 'isMe'>,
    value: string | number
  ) => void;
}

const ALL_GENDER_OPTIONS: { value: GenderType; labelKey: string }[] = [
  { value: 'MALE', labelKey: 'male' },
  { value: 'FEMALE', labelKey: 'female' },
  { value: 'OTHER', labelKey: 'other' },
  { value: 'PREFER_NOT_TO_SAY', labelKey: 'preferNotToSay' },
];

// Gender options for sessions with fee config (only Male/Female supported for fee calculation)
const FEE_GENDER_OPTIONS: { value: GenderType; labelKey: string }[] = [
  { value: 'MALE', labelKey: 'male' },
  { value: 'FEMALE', labelKey: 'female' },
];

export default function JoinSessionForm({
  session,
  players,
  errors,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
}: JoinSessionFormProps) {
  const t = useTranslations('session');
  const tPlayer = useTranslations('pages.playerManagement');
  const { getLevelLabel } = useLevelLabel();

  const availableLevels = useMemo(() => {
    if (session.requiredLevels && session.requiredLevels.length > 0) {
      return [...session.requiredLevels].sort((a, b) => a - b);
    }
    return VALID_LEVELS;
  }, [session.requiredLevels]);

  // Use restricted gender options if session has fee config
  const genderOptions = useMemo(() => {
    return session.feeConfig ? FEE_GENDER_OPTIONS : ALL_GENDER_OPTIONS;
  }, [session.feeConfig]);

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="sm" color="fg.muted">
        {t('joinSessionDescription', { hostName: session.host?.name || '' })}
      </Text>

      {session.requiredLevels && session.requiredLevels.length > 0 && (
        <Box bg={{ base: 'blue.50', _dark: 'blue.900/30' }} p={3} borderRadius="md">
          <Text fontSize="sm" color={{ base: 'blue.700', _dark: 'blue.300' }}>
            {t('requiredLevels')}:{' '}
            {session.requiredLevels.map((l) => t(`levels.${l}`)).join(', ')}
          </Text>
        </Box>
      )}

      <Divider />

      {players.map((player, index) => (
        <Box
          key={index}
          p={4}
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          position="relative"
          bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
          shadow="sm"
        >
          {/* Header with badge and delete button */}
          <Flex justify="space-between" align="center" mb={4}>
            <Flex align="center" gap={2}>
              <Box
                bg={player.isMe ? 'blue.500' : 'green.500'}
                p={1.5}
                borderRadius="full"
              >
                <User size={14} color="white" />
              </Box>
              <Badge
                colorPalette={player.isMe ? 'blue' : 'green'}
                variant="subtle"
                borderRadius="full"
                px={2}
              >
                {player.isMe ? t('you') : t('guest')}
              </Badge>
            </Flex>

            {!player.isMe && (
              <IconButton
                aria-label="Remove"
                icon={<Trash2 size={16} />}
                size="sm"
                colorPalette="red"
                variant="ghost"
                onClick={() => onRemovePlayer(index)}
              />
            )}
          </Flex>

          <VStack spacing={4} align="stretch">
            {/* Player name */}
            <FormControl isRequired isInvalid={!!errors[index]?.name}>
              <FormLabel fontSize="sm" fontWeight="medium" color="fg.muted">
                {player.isMe ? t('myName') : t('guestName')}
              </FormLabel>
              <Input
                value={player.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onUpdatePlayer(index, 'name', e.target.value)
                }
                placeholder={t('enterName')}
                bg={{ base: 'white', _dark: 'gray.800' }}
                size="md"
                borderColor={errors[index]?.name ? 'red.400' : 'border'}
                _focus={{
                  borderColor: errors[index]?.name ? 'red.400' : 'blue.500',
                  boxShadow: errors[index]?.name
                    ? '0 0 0 1px #F56565'
                    : '0 0 0 1px #3182ce',
                }}
              />
              {errors[index]?.name && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {tPlayer('playerNameRequired')}
                </Text>
              )}
            </FormControl>

            {/* Gender and Level - responsive grid */}
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <Box>
                <Text
                  fontSize="sm"
                  mb={2}
                  color="fg.muted"
                  fontWeight="medium"
                >
                  {tPlayer('gender')}
                </Text>
                <select
                  value={player.gender}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    onUpdatePlayer(index, 'gender', e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--chakra-colors-border)',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    fontSize: '14px',
                  }}
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {tPlayer(option.labelKey)}
                    </option>
                  ))}
                </select>
              </Box>

              <FormControl isRequired isInvalid={!!errors[index]?.level}>
                <Text
                  fontSize="sm"
                  mb={2}
                  color="fg.muted"
                  fontWeight="medium"
                >
                  {t('level')} <Text as="span" color="red.500">*</Text>
                </Text>
                <select
                  value={player.level}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    onUpdatePlayer(index, 'level', parseInt(e.target.value))
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: errors[index]?.level
                      ? '1px solid var(--chakra-colors-red-400)'
                      : '1px solid var(--chakra-colors-border)',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    fontSize: '14px',
                  }}
                >
                  <option value={0}>{tPlayer('selectLevel')}</option>
                  {availableLevels.map((l) => (
                    <option key={l} value={l}>
                      {getLevelLabel(l)}
                    </option>
                  ))}
                </select>
                {errors[index]?.level && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {t('validation.levelRequired')}
                  </Text>
                )}
              </FormControl>
            </Grid>

            {/* Level description */}
            <Box>
              <Text
                fontSize="sm"
                mb={2}
                color="fg.muted"
                fontWeight="medium"
              >
                {tPlayer('levelDescription')}
              </Text>
              <Textarea
                placeholder={tPlayer('levelDescriptionPlaceholder')}
                size="md"
                bg={{ base: 'white', _dark: 'gray.800' }}
                value={player.levelDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  onUpdatePlayer(index, 'levelDescription', e.target.value)
                }
                rows={2}
                resize="none"
              />
            </Box>
          </VStack>
        </Box>
      ))}

      <Button
        leftIcon={<Plus size={16} />}
        variant="outline"
        size="sm"
        onClick={onAddPlayer}
        colorPalette="green"
      >
        {t('addGuest')}
      </Button>
    </VStack>
  );
}
