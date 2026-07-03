'use client';
import { Input } from '@/components/ui/Input';

import React, { useState, useEffect, useRef } from 'react';
import { Badge, Box, Flex, Grid, Text, Textarea } from '@chakra-ui/react';
import { HStack, VStack, Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { VSwitch } from '@/components/ui/VSwitch';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Edit, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
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
  const [isCustomFeeEnabled, setIsCustomFeeEnabled] = useState(false);
  const [, setClubFeeConfig] = useState<IClubFeeConfig | null>(null);
  const [isLoadingClubFee, setIsLoadingClubFee] = useState(false);
  const [customFeeInput, setCustomFeeInput] = useState<string>('');
  // Set when the user changes the club, so the fetched club fee is applied
  // to the amount (and NOT on initial mount, to preserve a saved custom fee).
  const pendingClubFeeFillRef = useRef(false);

  // Initialize enabled + expanded state when a different player is opened
  useEffect(() => {
    const hasCustomFee =
      editingData?.customFee !== null && editingData?.customFee !== undefined;
    const enabled = hasCustomFee || !!editingData?.clubId;
    setIsCustomFeeEnabled(enabled);
    setIsFeeConfigExpanded(enabled);
    // Only re-run when switching to a different player
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  // Initialize customFeeInput from editingData when a different player is opened
  useEffect(() => {
    const fee = editingData?.customFee;
    if (fee !== null && fee !== undefined) {
      setCustomFeeInput(fee.toLocaleString('vi-VN'));
    } else {
      setCustomFeeInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  // Handle custom fee input change (formats with thousand separators)
  const handleCustomFeeChange = (value: string) => {
    if (!player) return;

    const digits = value.replace(/[^0-9]/g, '');
    if (digits === '') {
      setCustomFeeInput('');
      onUpdateEditing(player.id, 'customFee', null);
      return;
    }
    const numValue = parseInt(digits, 10);
    setCustomFeeInput(numValue.toLocaleString('vi-VN'));
    onUpdateEditing(player.id, 'customFee', numValue);
  };

  // Toggle the custom fee feature on/off for this player
  const handleToggleCustomFee = (enabled: boolean) => {
    if (!player) return;
    setIsCustomFeeEnabled(enabled);
    setIsFeeConfigExpanded(enabled);

    if (!enabled) {
      // Turning off: clear any custom fee + club selection so the player
      // falls back to the default session fee.
      setCustomFeeInput('');
      onUpdateEditing(player.id, 'customFee', null);
      onUpdateEditing(player.id, 'clubId', undefined);
      onUpdateEditing(player.id, 'isClubMember', false);
    }
  };

  // Fetch the club fee when the club (or session date) changes, then — if the
  // user just switched the club — apply that fee to the amount. When the club
  // has no configured fee, the amount is cleared to blank.
  useEffect(() => {
    let cancelled = false;

    const pickFee = (config: IClubFeeConfig | null): number | null => {
      if (!config) return null;
      const gender = editingData?.gender || 'MALE';
      return gender === 'FEMALE'
        ? (config.femaleFeePerSession ?? config.maleFeePerSession ?? null)
        : (config.maleFeePerSession ?? config.femaleFeePerSession ?? null);
    };

    const applyPendingFill = (config: IClubFeeConfig | null) => {
      if (!pendingClubFeeFillRef.current || !player) return;
      pendingClubFeeFillRef.current = false;
      const fee = pickFee(config);
      handleCustomFeeChange(fee !== null ? fee.toString() : '');
    };

    const run = async () => {
      if (!editingData?.clubId || !session?.startTime) {
        setClubFeeConfig(null);
        applyPendingFill(null);
        return;
      }

      setIsLoadingClubFee(true);
      try {
        const sessionDate = new Date(session.startTime);
        const config = await ClubsService.getClubFeeForMonth(
          editingData.clubId,
          sessionDate.getFullYear(),
          sessionDate.getMonth() + 1
        );
        if (cancelled) return;
        setClubFeeConfig(config);
        applyPendingFill(config);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to fetch club fee:', error);
        setClubFeeConfig(null);
        applyPendingFill(null);
      } finally {
        if (!cancelled) setIsLoadingClubFee(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // Only re-fetch when the club or session date changes (not on every keystroke)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingData?.clubId, session?.startTime]);

  // Early return after all hooks
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

        {/* Fee Configuration Section (Collapsible) */}
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
        >
          <Flex align="center" justify="space-between" gap={3} px={4} py={1.5}>
            <HStack gap={2} minW={0}>
              <DollarSign size={16} color="#179a3b" />
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                {t('customFeeSection')}
              </Text>
            </HStack>

            <HStack gap={2} flexShrink={0}>
              <VSwitch
                checked={isCustomFeeEnabled}
                onCheckedChange={(details) =>
                  handleToggleCustomFee(!!details.checked)
                }
                colorPalette="green"
                size="sm"
                aria-label={
                  isCustomFeeEnabled
                    ? t('disableCustomFee')
                    : t('enableCustomFee')
                }
              />
              <Button
                type="button"
                onClick={() =>
                  isCustomFeeEnabled &&
                  setIsFeeConfigExpanded(!isFeeConfigExpanded)
                }
                variant="ghost"
                boxSize={7}
                minW={7}
                p={0}
                disabled={!isCustomFeeEnabled}
                opacity={isCustomFeeEnabled ? 1 : 0.45}
                _hover={isCustomFeeEnabled ? { bg: 'gray.50' } : undefined}
              >
                {isCustomFeeEnabled && isFeeConfigExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </Button>
            </HStack>
          </Flex>

          {isCustomFeeEnabled && isFeeConfigExpanded && (
            <VStack align="stretch" gap={3} p={4} pt={0} bg="gray.50">
              {/* Club Select - inline with label */}
              <Flex align="center" gap={3}>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="medium"
                  w="90px"
                  flexShrink={0}
                >
                  {t('clubMember')}
                </Text>
                <Box flex={1}>
                  <select
                    value={editingData.clubId || ''}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      onUpdateEditing(player.id, 'clubId', val);
                      onUpdateEditing(player.id, 'isClubMember', !!val);
                      // Apply the club's fee to the amount once it's fetched.
                      if (val) {
                        pendingClubFeeFillRef.current = true;
                      }
                    }}
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
              </Flex>

              {/* Custom Fee Input */}
              <Flex align="center" gap={3}>
                <Text
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="medium"
                  w="90px"
                  flexShrink={0}
                >
                  {t('customFeeAmount')}
                </Text>
                <Box flex={1}>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={customFeeInput}
                    onChange={(e) => handleCustomFeeChange(e.target.value)}
                    size="md"
                    bg="white"
                    isDisabled={isLoadingClubFee}
                    rightElement={
                      <Text fontSize="sm" color="gray.500" fontWeight="medium">
                        VNĐ
                      </Text>
                    }
                  />
                </Box>
              </Flex>

              <Text fontSize="xs" color="gray.500">
                💡 {t('customFeeHint')}
              </Text>
            </VStack>
          )}
        </Box>
      </VStack>
    </VModal>
  );
};

export default EditPlayerModal;
