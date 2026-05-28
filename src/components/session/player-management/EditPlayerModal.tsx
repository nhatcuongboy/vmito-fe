'use client';
import { Input } from '@/components/ui/Input';

import React from 'react';
import { Badge, Box, Flex, Grid, Text, Textarea } from '@chakra-ui/react';
import { HStack, VStack } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Edit } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Player } from './types';
import { IClub } from '@/types/club';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  editingData: Player | null;
  clubs?: IClub[];
  availableLevels: number[];
  isSaving: boolean;
  onUpdateEditing: (
    playerId: string,
    field: string,
    value: string | boolean | number | null | undefined
  ) => void;
  onSave: (playerId: string) => void;
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  isOpen,
  onClose,
  player,
  editingData,
  availableLevels,
  clubs = [],
  isSaving,
  onUpdateEditing,
  onSave,
}) => {
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  const { getLevelLabel } = useLevelLabel();

  if (!player || !editingData) return null;

  const handleSave = async () => {
    await onSave(player.id);
    onClose();
  };

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <HStack spacing={3}>
          <Box as={Edit} boxSize={5} color="green.600" />
          <Text fontWeight="semibold">
            {t('editPlayerModalTitle', { number: player.playerNumber })}
          </Text>
        </HStack>
      }
      size="lg"
      maxBodyHeight="70vh"
      primaryActionText={t('saveChanges')}
      onPrimaryAction={handleSave}
      isPrimaryLoading={isSaving}
      primaryColorScheme="green"
      secondaryActionText={t('cancelEditing')}
      onSecondaryAction={onClose}
    >
      <VStack spacing={3} align="stretch">
        {/* Header with player number */}
        <HStack spacing={3}>
          <Badge
            colorPalette="green"
            variant="solid"
            borderRadius="full"
            px={3}
          >
            #{player.playerNumber}
          </Badge>
          <Text fontSize="sm" color="green.600" fontWeight="medium">
            {editingData.name || `Player ${player.playerNumber}`}
          </Text>
        </HStack>

        {/* Player name and phone */}
        <Grid templateColumns="1fr 1fr" gap={3}>
          <Box>
            <Text fontSize="sm" mb={1} color="fg.muted" fontWeight="medium">
              {t('playerName')}
            </Text>
            <Input
              value={editingData.name}
              onChange={(e) =>
                onUpdateEditing(player.id, 'name', e.target.value)
              }
              size="md"
              bg="white"
              placeholder={t('enterPlayerName')}
            />
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="fg.muted" fontWeight="medium">
              {tCommon('phone')} ({tCommon('optional')})
            </Text>
            <Input
              placeholder={tCommon('phone')}
              value={editingData.phone || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                onUpdateEditing(player.id, 'phone', e.target.value);
              }}
              size="md"
              bg="white"
            />
          </Box>
        </Grid>

        {/* Gender and Level */}
        <Grid templateColumns="1fr 1fr" gap={3}>
          <Box>
            <Text fontSize="sm" mb={1} color="fg.muted" fontWeight="medium">
              {t('gender')}
            </Text>
            <select
              value={editingData.gender}
              onChange={(e) =>
                onUpdateEditing(player.id, 'gender', e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid var(--chakra-colors-border)',
                backgroundColor: 'var(--chakra-colors-bg)',
                color: 'inherit',
                fontSize: '14px',
              }}
            >
              <option
                value="MALE"
                style={{ backgroundColor: 'var(--chakra-colors-bg)' }}
              >
                {t('male')}
              </option>
              <option
                value="FEMALE"
                style={{ backgroundColor: 'var(--chakra-colors-bg)' }}
              >
                {t('female')}
              </option>
              <option
                value="OTHER"
                style={{ backgroundColor: 'var(--chakra-colors-bg)' }}
              >
                {t('other')}
              </option>
              <option
                value="PREFER_NOT_TO_SAY"
                style={{ backgroundColor: 'var(--chakra-colors-bg)' }}
              >
                {t('preferNotToSay')}
              </option>
            </select>
          </Box>
          <Box>
            <Text fontSize="sm" mb={1} color="fg.muted" fontWeight="medium">
              {t('level')}
            </Text>
            <select
              value={editingData.level === null ? '' : editingData.level}
              onChange={(e) =>
                onUpdateEditing(
                  player.id,
                  'level',
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                height: '40px',
                borderRadius: '6px',
                border: '1px solid var(--chakra-colors-border)',
                backgroundColor: 'var(--chakra-colors-bg)',
                color: 'inherit',
                fontSize: '14px',
              }}
            >
              <option
                value=""
                style={{ backgroundColor: 'var(--chakra-colors-bg)' }}
              >
                {t('selectLevel')}
              </option>
              {availableLevels.map((level) => (
                <option
                  key={level}
                  value={level}
                  style={{ backgroundColor: 'var(--chakra-colors-bg)' }}
                >
                  {getLevelLabel(level)}
                </option>
              ))}
            </select>
          </Box>
        </Grid>

        {/* Level description */}
        <Box>
          <Text fontSize="sm" mb={1} color="fg.muted" fontWeight="medium">
            {t('levelDescription')}
          </Text>
          <Textarea
            placeholder={t('levelDescriptionPlaceholder')}
            size="md"
            bg="white"
            value={editingData.levelDescription || ''}
            onChange={(e) =>
              onUpdateEditing(player.id, 'levelDescription', e.target.value)
            }
            rows={2}
          />
        </Box>

        {/* Confirmation checkboxes */}
        <Box>
          <VStack align="stretch" spacing={2}>
            <Flex align="center" gap={3}>
              <input
                type="checkbox"
                id={`requireConfirm-edit-${player.id}`}
                checked={editingData.requireConfirmInfo || false}
                onChange={(e) =>
                  onUpdateEditing(
                    player.id,
                    'requireConfirmInfo',
                    e.target.checked
                  )
                }
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#179a3b',
                }}
              />
              <label
                htmlFor={`requireConfirm-edit-${player.id}`}
                style={{
                  fontSize: '14px',
                  color: '#4A5568',
                  lineHeight: '1.4',
                }}
              >
                {t('requirePlayerConfirmInfo')}
              </label>
            </Flex>
            <Flex align="center" gap={3}>
              <input
                type="checkbox"
                id={`confirmedByPlayer-edit-${player.id}`}
                checked={editingData.confirmedByPlayer || false}
                onChange={(e) =>
                  onUpdateEditing(
                    player.id,
                    'confirmedByPlayer',
                    e.target.checked
                  )
                }
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#38a169',
                }}
              />
              <label
                htmlFor={`confirmedByPlayer-edit-${player.id}`}
                style={{
                  fontSize: '14px',
                  color: '#22543d',
                  lineHeight: '1.4',
                }}
              >
                {t('confirmedByPlayer')}
              </label>
            </Flex>

            {/* Club Checkbox */}
            <Flex align="center" gap={3}>
              <input
                type="checkbox"
                id={`isClubMember-edit-${player.id}`}
                checked={editingData.isClubMember || false}
                onChange={(e) => {
                  onUpdateEditing(player.id, 'isClubMember', e.target.checked);
                  if (!e.target.checked) {
                    onUpdateEditing(player.id, 'clubId', undefined);
                  }
                }}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#179a3b',
                }}
              />
              <label
                htmlFor={`isClubMember-edit-${player.id}`}
                style={{
                  fontSize: '14px',
                  color: '#4A5568',
                  lineHeight: '1.4',
                }}
              >
                {t('isClubMember')}
              </label>
            </Flex>

            {/* Club Select */}
            {editingData.isClubMember && (
              <Box ml={7}>
                <Text fontSize="sm" mb={1} color="gray.600" fontWeight="medium">
                  {t('selectClub')}
                </Text>
                <select
                  value={editingData.clubId || ''}
                  onChange={(e) =>
                    onUpdateEditing(player.id, 'clubId', e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: 'white',
                    color: 'inherit',
                    fontSize: '14px',
                  }}
                >
                  <option value="">{t('selectClubPlaceholder')}</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </Box>
            )}
          </VStack>
        </Box>
      </VStack>
    </VModal>
  );
};

export default EditPlayerModal;
