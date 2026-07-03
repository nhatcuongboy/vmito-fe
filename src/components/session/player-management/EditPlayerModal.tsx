'use client';
import { Input } from '@/components/ui/Input';

import React, { useState, useEffect } from 'react';
import { Badge, Box, Flex, Grid, Text, Textarea } from '@chakra-ui/react';
import { HStack, VStack, Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  Edit,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Player } from './types';
import { IClub, IClubFeeConfig } from '@/types/club';
import { ClubsService } from '@/lib/api/clubs.service';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  editingData: Player | null;
  clubs?: IClub[];
  availableLevels: number[];
  isSaving: boolean;
  session?: { id: string; startTime?: string | Date }; // Add session prop
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
  session,
  onUpdateEditing,
  onSave,
}) => {
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  const { getLevelLabel } = useLevelLabel();

  // Fee configuration state
  const [isFeeConfigExpanded, setIsFeeConfigExpanded] = useState(false);
  const [clubFeeConfig, setClubFeeConfig] = useState<IClubFeeConfig | null>(
    null
  );
  const [isLoadingClubFee, setIsLoadingClubFee] = useState(false);
  const [customFeeInput, setCustomFeeInput] = useState<string>('');

  // Fetch club fee when club or gender changes
  useEffect(() => {
    if (!player || !editingData) return;

    const fetchClubFee = async () => {
      // Use non-null assertion since we've already checked above
      if (!editingData!.clubId || !session?.startTime) {
        setClubFeeConfig(null);
        return;
      }

      setIsLoadingClubFee(true);
      try {
        const sessionDate = new Date(session.startTime);
        const config = await ClubsService.getClubFeeForMonth(
          editingData!.clubId,
          sessionDate.getFullYear(),
          sessionDate.getMonth() + 1
        );
        setClubFeeConfig(config);
      } catch (error) {
        console.error('Failed to fetch club fee:', error);
        setClubFeeConfig(null);
      } finally {
        setIsLoadingClubFee(false);
      }
    };

    if (editingData!.isClubMember && editingData!.clubId) {
      fetchClubFee();
    } else {
      setClubFeeConfig(null);
    }
  }, [
    editingData?.clubId,
    editingData?.isClubMember,
    editingData?.gender,
    session?.startTime,
    player,
    editingData,
  ]);

  // Initialize customFeeInput from editingData
  useEffect(() => {
    if (!player || !editingData) return;
    if (editingData.customFee !== null && editingData.customFee !== undefined) {
      setCustomFeeInput(editingData.customFee.toString());
    } else {
      setCustomFeeInput('');
    }
  }, [editingData?.customFee, player?.id, player, editingData]);

  // Early return after all hooks
  if (!player || !editingData) return null;

  // Get club fee for current gender
  const getClubFeeForGender = (): number | null => {
    if (!clubFeeConfig) return null;
    const gender = editingData.gender || 'MALE';
    if (gender === 'FEMALE') {
      return (
        clubFeeConfig.femaleFeePerSession ??
        clubFeeConfig.maleFeePerSession ??
        null
      );
    }
    return (
      clubFeeConfig.maleFeePerSession ??
      clubFeeConfig.femaleFeePerSession ??
      null
    );
  };

  const clubFee = getClubFeeForGender();

  // Handle custom fee input change
  const handleCustomFeeChange = (value: string) => {
    setCustomFeeInput(value);
    const numValue = value === '' ? null : parseInt(value, 10);
    if (value === '' || !isNaN(numValue!)) {
      onUpdateEditing(player.id, 'customFee', numValue);
    }
  };

  // Copy club fee to custom fee
  const handleCopyClubFee = () => {
    if (clubFee !== null) {
      handleCustomFeeChange(clubFee.toString());
    }
  };

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
          </VStack>
        </Box>

        {/* Fee Configuration Section (Collapsible) */}
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
        >
          <Button
            onClick={() => setIsFeeConfigExpanded(!isFeeConfigExpanded)}
            variant="ghost"
            width="full"
            justifyContent="space-between"
            px={4}
            py={3}
            _hover={{ bg: 'gray.50' }}
          >
            <HStack gap={2}>
              <DollarSign size={16} color="#179a3b" />
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                {t('feeConfiguration')}
              </Text>
            </HStack>
            {isFeeConfigExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </Button>

          {isFeeConfigExpanded && (
            <VStack align="stretch" gap={3} p={4} bg="gray.50">
              {/* Club Membership Checkbox */}
              <Flex align="center" gap={3}>
                <input
                  type="checkbox"
                  id={`isClubMember-edit-${player.id}`}
                  checked={editingData.isClubMember || false}
                  onChange={(e) => {
                    onUpdateEditing(
                      player.id,
                      'isClubMember',
                      e.target.checked
                    );
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
                <Box>
                  <Text
                    fontSize="sm"
                    mb={1}
                    color="gray.600"
                    fontWeight="medium"
                  >
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

              {/* Club Fee Info */}
              {editingData.isClubMember && editingData.clubId && (
                <Box
                  p={3}
                  bg={clubFee ? 'green.50' : 'orange.50'}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={clubFee ? 'green.200' : 'orange.200'}
                >
                  {isLoadingClubFee ? (
                    <Text fontSize="sm" color="gray.600">
                      {t('loadingClubFee')}...
                    </Text>
                  ) : clubFee !== null ? (
                    <VStack align="stretch" gap={2}>
                      <HStack gap={2}>
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="green.700"
                        >
                          {t('clubFeeAvailable')}
                        </Text>
                        <Badge colorPalette="green" size="sm">
                          {editingData.gender === 'FEMALE'
                            ? t('female')
                            : t('male')}
                        </Badge>
                      </HStack>
                      <Text fontSize="lg" fontWeight="bold" color="green.700">
                        {clubFee.toLocaleString('vi-VN')} ₫ / {t('session')}
                      </Text>
                      <Button
                        size="xs"
                        variant="outline"
                        colorPalette="green"
                        onClick={handleCopyClubFee}
                        width="fit-content"
                      >
                        {t('applyClubFee')}
                      </Button>
                    </VStack>
                  ) : (
                    <HStack gap={2}>
                      <AlertCircle size={16} color="#F97316" />
                      <Text fontSize="sm" color="orange.700">
                        {t('clubFeeNotConfigured')}
                      </Text>
                    </HStack>
                  )}
                </Box>
              )}

              {/* Custom Fee Input */}
              <Box>
                <Text fontSize="sm" mb={1} color="gray.700" fontWeight="medium">
                  {t('customFeeForThisSession')}
                </Text>
                <HStack>
                  <Input
                    type="number"
                    value={customFeeInput}
                    onChange={(e) => handleCustomFeeChange(e.target.value)}
                    placeholder={t('customFeePlaceholder')}
                    size="md"
                    bg="white"
                  />
                  <Text
                    fontSize="sm"
                    color="gray.500"
                    fontWeight="medium"
                    minW="fit-content"
                  >
                    VNĐ
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  💡 {t('customFeeHint')}
                </Text>
              </Box>
            </VStack>
          )}
        </Box>
      </VStack>
    </VModal>
  );
};

export default EditPlayerModal;
