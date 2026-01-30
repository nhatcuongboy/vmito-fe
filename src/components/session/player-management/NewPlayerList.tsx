import {
  Badge,
  Box,
  Flex,
  Grid,
  Heading,
  Input,
  Text,
  Textarea,
} from '@chakra-ui/react';
import {
  Button,
  Card,
  CardBody,
  HStack,
  IconButton,
  VStack,
} from '@/components/ui/chakra-compat';
import { UserOption } from '@/lib/api/user.service';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Plus, Save, Trash2, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { NewPlayer } from './types';

interface NewPlayerListProps {
  newPlayers: NewPlayer[];
  availableUsers: UserOption[];
  isLoadingUsers: boolean;
  errors: { [index: number]: string };
  availableLevels: number[];
  isSaving: boolean;
  onUpdatePlayer: (
    index: number,
    field: string,
    value: string | boolean | number | null
  ) => void;
  onRemovePlayer: (index: number) => void;
  onUserSelect: (index: number, userId: string) => void;
  onAddPlayer: () => void;
  onSaveAll: () => void;
  onCancelAll: () => void;
  isUserAlreadyUsed: (userId: string, currentIndex?: number) => boolean;
}

const NewPlayerList: React.FC<NewPlayerListProps> = ({
  newPlayers,
  availableUsers,
  isLoadingUsers,
  errors,
  availableLevels,
  isSaving,
  onUpdatePlayer,
  onRemovePlayer,
  onUserSelect,
  onAddPlayer,
  onSaveAll,
  onCancelAll,
  isUserAlreadyUsed,
}) => {
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  const { getLevelLabel } = useLevelLabel();

  if (newPlayers.length === 0) return null;

  return (
    <Card variant="outline" borderColor="green.200" bg="green.50">
      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack spacing={3}>
            <Box as={UserCheck} boxSize={5} color="green.600" />
            <Heading size="sm" color="green.700">
              {t('newPlayersTitle', { count: newPlayers.length })}
            </Heading>
          </HStack>

          {/* Player cards */}
          <VStack spacing={4}>
            {newPlayers.map((player, index) => (
              <Card
                key={index}
                width="100%"
                variant="outline"
                bg="white"
                shadow="sm"
              >
                <CardBody p={{ base: 4, md: 5 }}>
                  <VStack spacing={4} align="stretch">
                    {/* Header with player number and delete button */}
                    <Flex justify="space-between" align="center">
                      <HStack spacing={3}>
                        <Badge
                          colorPalette="green"
                          variant="solid"
                          borderRadius="full"
                          px={3}
                        >
                          #{player.playerNumber}
                        </Badge>
                        <Text
                          fontSize="sm"
                          color="gray.600"
                          fontWeight="medium"
                        >
                          {t('newPlayer')}
                        </Text>
                      </HStack>
                      <IconButton
                        aria-label="Remove player"
                        icon={<Box as={Trash2} boxSize={4} />}
                        size="sm"
                        colorPalette="red"
                        variant="ghost"
                        onClick={() => onRemovePlayer(index)}
                      />
                    </Flex>

                    {/* Player name - full width on mobile */}
                    <Box>
                      <Text
                        fontSize="sm"
                        mb={2}
                        color="gray.600"
                        fontWeight="medium"
                      >
                        {t('selectExistingPlayer')}
                      </Text>
                      <select
                        value={player.userId || ''}
                        onChange={(e) => onUserSelect(index, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: 'white',
                          fontSize: '14px',
                          marginBottom: '12px',
                        }}
                        disabled={isLoadingUsers}
                      >
                        <option value="">{t('createNewPlayer')}</option>
                        {availableUsers.map((user) => {
                          const isUsed = isUserAlreadyUsed(user.id, index);
                          return (
                            <option
                              key={user.id}
                              value={user.id}
                              disabled={isUsed}
                              style={{
                                color: isUsed ? '#A0AEC0' : 'inherit',
                                fontStyle: isUsed ? 'italic' : 'normal',
                              }}
                            >
                              {user.name} ({user.email})
                              {isUsed ? ` - ${t('alreadySelected')}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </Box>

                    <Box>
                      <Text
                        fontSize="sm"
                        mb={2}
                        color="gray.600"
                        fontWeight="medium"
                      >
                        {t('playerName')}
                      </Text>
                      <Input
                        placeholder={t('enterPlayerName')}
                        value={player.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          onUpdatePlayer(index, 'name', e.target.value);
                        }}
                        size="md"
                        borderColor={errors[index] ? 'red.400' : undefined}
                        boxShadow={
                          errors[index] ? '0 0 0 1px #F56565' : undefined
                        }
                        _focus={{
                          borderColor: errors[index] ? 'red.400' : 'blue.500',
                          boxShadow: errors[index]
                            ? '0 0 0 1px #F56565'
                            : '0 0 0 1px #3182ce',
                        }}
                        disabled={!!player.userId}
                        opacity={player.userId ? 0.6 : 1}
                        cursor={player.userId ? 'not-allowed' : 'text'}
                      />
                      {errors[index] && (
                        <Text fontSize="xs" color="red.500" mt={1}>
                          {errors[index]}
                        </Text>
                      )}
                    </Box>

                    {/* Gender and Level - responsive grid */}
                    <Grid
                      templateColumns={{ base: '1fr', md: '1fr 1fr' }}
                      gap={4}
                    >
                      <Box>
                        <Text
                          fontSize="sm"
                          mb={2}
                          color="gray.600"
                          fontWeight="medium"
                        >
                          {t('gender')}
                        </Text>
                        <select
                          value={player.gender}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            onUpdatePlayer(index, 'gender', e.target.value)
                          }
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: player.userId
                              ? '#F7FAFC'
                              : 'white',
                            fontSize: '14px',
                            opacity: player.userId ? 0.6 : 1,
                            cursor: player.userId ? 'not-allowed' : 'pointer',
                          }}
                          disabled={!!player.userId}
                        >
                          <option value="MALE">{t('male')}</option>
                          <option value="FEMALE">{t('female')}</option>
                          <option value="OTHER">{t('other')}</option>
                          <option value="PREFER_NOT_TO_SAY">
                            {t('preferNotToSay')}
                          </option>
                        </select>
                      </Box>
                      <Box>
                        <Text
                          fontSize="sm"
                          mb={2}
                          color="gray.600"
                          fontWeight="medium"
                        >
                          {t('level')}
                        </Text>
                        <select
                          value={player.level === null ? '' : player.level}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            onUpdatePlayer(
                              index,
                              'level',
                              e.target.value ? parseInt(e.target.value, 10) : null
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #E2E8F0',
                            backgroundColor: player.userId
                              ? '#F7FAFC'
                              : 'white',
                            fontSize: '14px',
                            opacity: player.userId ? 0.6 : 1,
                            cursor: player.userId ? 'not-allowed' : 'pointer',
                          }}
                          disabled={!!player.userId}
                        >
                          <option value="">{t('selectLevel')}</option>
                          {availableLevels.map((level) => (
                            <option key={level} value={level}>
                              {getLevelLabel(level)}
                            </option>
                          ))}
                        </select>
                      </Box>
                    </Grid>

                    {/* Level description */}
                    <Box>
                      <Text
                        fontSize="sm"
                        mb={2}
                        color="gray.600"
                        fontWeight="medium"
                      >
                        {t('levelDescription')}
                      </Text>
                      <Textarea
                        placeholder={t('levelDescriptionPlaceholder')}
                        size="md"
                        value={player.levelDescription || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          onUpdatePlayer(
                            index,
                            'levelDescription',
                            e.target.value
                          )
                        }
                        rows={3}
                        disabled={!!player.userId}
                        opacity={player.userId ? 0.6 : 1}
                        cursor={player.userId ? 'not-allowed' : 'text'}
                        bg={player.userId ? 'gray.50' : 'white'}
                      />
                    </Box>

                    {/* Confirmation checkbox */}
                    <Box>
                      <Flex align="center" gap={3}>
                        <input
                          type="checkbox"
                          id={`requireConfirm-${index}`}
                          checked={player.requireConfirmInfo || false}
                          onChange={(e) =>
                            onUpdatePlayer(
                              index,
                              'requireConfirmInfo',
                              e.target.checked
                            )
                          }
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: '#3182ce',
                          }}
                        />
                        <label
                          htmlFor={`requireConfirm-${index}`}
                          style={{
                            fontSize: '14px',
                            color: '#4A5568',
                            lineHeight: '1.4',
                          }}
                        >
                          {t('requirePlayerConfirmInfo')}
                        </label>
                      </Flex>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>

          {/* Action buttons for new players */}
          <Flex
            justify="space-between"
            gap={3}
            pt={4}
            borderTop="1px solid"
            borderColor="green.200"
            flexWrap="wrap"
          >
            <Button
              size="sm"
              leftIcon={<Box as={Plus} boxSize={4} />}
              onClick={onAddPlayer}
              colorPalette="green"
              variant="outline"
              title="Add another player"
            >
              {t('addAnother')}
            </Button>

            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<Box as={Save} boxSize={4} />}
                colorPalette="green"
                onClick={onSaveAll}
                loading={isSaving}
                disabled={Object.keys(errors).length > 0}
              >
                {t('saveAll', { count: newPlayers.length })}
              </Button>
              <Button
                size="sm"
                leftIcon={<Box as={Trash2} boxSize={4} />}
                colorPalette="red"
                variant="outline"
                onClick={onCancelAll}
              >
                {tCommon('cancel')}
              </Button>
            </HStack>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default NewPlayerList;
