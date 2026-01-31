'use client';

import React from 'react';
import {
  Badge,
  Box,
  Flex,
  Grid,
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
import { CommonModal } from '@/components/ui/CommonModal';
import { UserOption } from '@/lib/api/user.service';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Plus, Save, Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NewPlayer } from './types';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  isOpen,
  onClose,
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

  const handleClose = () => {
    onCancelAll();
    onClose();
  };

  const handleSave = async () => {
    await onSaveAll();
    onClose();
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <HStack spacing={3}>
          <Box as={UserPlus} boxSize={5} color="green.600" />
          <Text fontWeight="semibold">
            {t('addPlayerModalTitle', { count: newPlayers.length })}
          </Text>
        </HStack>
      }
      size="lg"
      maxBodyHeight="70vh"
      primaryActionText={t('saveAll', { count: newPlayers.length })}
      onPrimaryAction={handleSave}
      isPrimaryLoading={isSaving}
      isPrimaryDisabled={
        Object.keys(errors).length > 0 || newPlayers.length === 0
      }
      primaryColorScheme="green"
      secondaryActionText={tCommon('cancel')}
      onSecondaryAction={handleClose}
    >
      <VStack spacing={4} align="stretch">
        {/* Player cards */}
        {newPlayers.map((player, index) => (
          <Card
            key={index}
            width="100%"
            variant="subtle"
            bg={{ base: "gray.50", _dark: "whiteAlpha.50" }}
            border="1px solid"
            borderColor={{ base: "gray.100", _dark: "whiteAlpha.100" }}
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
                    <Text fontSize="sm" color="fg.muted" fontWeight="medium">
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

                {/* Select existing player */}
                <Box>
                  <Text
                    fontSize="sm"
                    mb={2}
                    color="fg.muted"
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
                      border: '1px solid var(--chakra-colors-border)',
                      backgroundColor: 'transparent',
                      color: 'inherit',
                      fontSize: '14px',
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

                {/* Player name */}
                <Box>
                  <Text
                    fontSize="sm"
                    mb={2}
                    color="fg.muted"
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
                    bg="white"
                    borderColor={errors[index] ? 'red.400' : undefined}
                    boxShadow={errors[index] ? '0 0 0 1px #F56565' : undefined}
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
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <Box>
                    <Text
                      fontSize="sm"
                      mb={2}
                      color="fg.muted"
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
                        border: '1px solid var(--chakra-colors-border)',
                        backgroundColor: 'transparent',
                        color: 'inherit',
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
                      color="fg.muted"
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
                        border: '1px solid var(--chakra-colors-border)',
                        backgroundColor: 'transparent',
                        color: 'inherit',
                        fontSize: '14px',
                        opacity: player.userId ? 0.6 : 1,
                        cursor: player.userId ? 'not-allowed' : 'pointer',
                      }}
                      disabled={!!player.userId}
                    >
                      <option value="">{t('selectLevel')}</option>
                      {Array.from(new Set(availableLevels)).map((level) => (
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
                    color="fg.muted"
                    fontWeight="medium"
                  >
                    {t('levelDescription')}
                  </Text>
                  <Textarea
                    placeholder={t('levelDescriptionPlaceholder')}
                    size="md"
                    bg="white"
                    value={player.levelDescription || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      onUpdatePlayer(index, 'levelDescription', e.target.value)
                    }
                    rows={2}
                    disabled={!!player.userId}
                    opacity={player.userId ? 0.6 : 1}
                    cursor={player.userId ? 'not-allowed' : 'text'}
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
                        color: 'inherit',
                        opacity: 0.8,
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

        {/* Add another player button */}
        <Button
          size="sm"
          leftIcon={<Box as={Plus} boxSize={4} />}
          onClick={onAddPlayer}
          colorPalette="green"
          variant="outline"
          w="fit-content"
        >
          {newPlayers.length === 0 ? t('addPlayer') : t('addAnother')}
        </Button>
      </VStack>
    </CommonModal>
  );
};

export default AddPlayerModal;
