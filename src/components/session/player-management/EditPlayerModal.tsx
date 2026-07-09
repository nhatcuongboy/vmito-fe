'use client';
import { Input } from '@/components/ui/Input';

import React, { useState, useEffect } from 'react';
import { Badge, Box, Flex, Grid, Text, Textarea } from '@chakra-ui/react';
import { HStack, VStack, Button } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { VSwitch } from '@/components/ui/VSwitch';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { Edit, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Player } from './types';
import { IClub } from '@/types/club';
import { pickClubFee, useClubSessionFees } from './useClubSessionFees';

const CONTROL_BG = { base: 'white', _dark: 'gray.900' } as const;
const CONTROL_BORDER = { base: 'gray.200', _dark: 'gray.600' } as const;
const MUTED_PANEL_BG = { base: 'gray.50', _dark: 'whiteAlpha.50' } as const;

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

  // Club fixed-fee section state
  const [isFeeConfigExpanded, setIsFeeConfigExpanded] = useState(false);
  const [isClubFeeEnabled, setIsClubFeeEnabled] = useState(false);

  // Fixed per-session fees of all clubs for the session's month. Only clubs
  // with a configured fee can be selected; the fee is shown read-only.
  const { feesByClubId, isLoading: isLoadingClubFees } = useClubSessionFees(
    clubs,
    session?.startTime,
    isOpen
  );
  const clubsWithFixedFee = clubs.filter(
    (club) => pickClubFee(feesByClubId[club.id]) !== null
  );

  // Initialize enabled + expanded state whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    const enabled = !!editingData?.clubId;
    setIsClubFeeEnabled(enabled);
    setIsFeeConfigExpanded(enabled);
    // Only re-run when the modal opens or switches to a different player
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, player?.id]);

  // Toggle the club fixed-fee feature on/off for this player
  const handleToggleClubFee = (enabled: boolean) => {
    if (!player) return;
    setIsClubFeeEnabled(enabled);
    setIsFeeConfigExpanded(enabled);

    if (!enabled) {
      // Turning off: clear the club selection so the player falls back to
      // the default session fee.
      onUpdateEditing(player.id, 'clubId', undefined);
      onUpdateEditing(player.id, 'isClubMember', false);
    }
  };

  // Early return after all hooks
  if (!player || !editingData) return null;

  // Fixed per-session fee of the selected club (per player gender)
  const clubFee = editingData.clubId
    ? pickClubFee(feesByClubId[editingData.clubId], editingData.gender)
    : null;

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
              value={editingData.name || ''}
              onChange={(e) =>
                onUpdateEditing(player.id, 'name', e.target.value)
              }
              size="md"
              bg={CONTROL_BG}
              borderColor={CONTROL_BORDER}
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
              bg={CONTROL_BG}
              borderColor={CONTROL_BORDER}
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
              value={editingData.gender || 'MALE'}
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
              value={editingData.level ?? ''}
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
            bg={CONTROL_BG}
            borderColor={CONTROL_BORDER}
            value={editingData.levelDescription || ''}
            onChange={(e) =>
              onUpdateEditing(player.id, 'levelDescription', e.target.value)
            }
            rows={2}
          />
        </Box>

        {/* Club Fixed Fee Section (Collapsible) */}
        <Box
          borderWidth="1px"
          borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
          borderRadius="md"
          overflow="hidden"
          bg={{ base: 'white', _dark: 'gray.800' }}
        >
          <Flex align="center" justify="space-between" gap={3} px={4} py={1.5}>
            <HStack gap={2} minW={0}>
              <DollarSign size={16} color="#179a3b" />
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color={{ base: 'gray.700', _dark: 'gray.200' }}
              >
                {t('clubFixedFeeSection')}
              </Text>
            </HStack>

            <HStack gap={2} flexShrink={0}>
              <VSwitch
                checked={isClubFeeEnabled}
                onCheckedChange={(details) =>
                  handleToggleClubFee(!!details.checked)
                }
                colorPalette="green"
                size="sm"
                aria-label={
                  isClubFeeEnabled
                    ? t('disableClubFixedFee')
                    : t('enableClubFixedFee')
                }
              />
              <Button
                type="button"
                onClick={() =>
                  isClubFeeEnabled &&
                  setIsFeeConfigExpanded(!isFeeConfigExpanded)
                }
                variant="ghost"
                boxSize={7}
                minW={7}
                p={0}
                disabled={!isClubFeeEnabled}
                opacity={isClubFeeEnabled ? 1 : 0.45}
                _hover={
                  isClubFeeEnabled
                    ? { bg: { base: 'gray.50', _dark: 'whiteAlpha.100' } }
                    : undefined
                }
              >
                {isClubFeeEnabled && isFeeConfigExpanded ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </Button>
            </HStack>
          </Flex>

          {isClubFeeEnabled && isFeeConfigExpanded && (
            <VStack align="stretch" gap={3} p={4} pt={0} bg={MUTED_PANEL_BG}>
              {isLoadingClubFees ? (
                <Text
                  fontSize="sm"
                  color={{ base: 'gray.500', _dark: 'gray.400' }}
                >
                  {t('loadingClubFee')}...
                </Text>
              ) : clubsWithFixedFee.length === 0 ? (
                <Text
                  fontSize="sm"
                  color={{ base: 'gray.500', _dark: 'gray.400' }}
                >
                  {t('noClubWithFixedFee')}
                </Text>
              ) : (
                <>
                  {/* Club Select - inline with label */}
                  <Flex align="center" gap={3}>
                    <Text
                      fontSize="sm"
                      color={{ base: 'gray.600', _dark: 'gray.300' }}
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
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid var(--chakra-colors-border)',
                          backgroundColor: 'var(--chakra-colors-bg)',
                          color: 'inherit',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">{t('selectClubPlaceholder')}</option>
                        {clubsWithFixedFee.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </Box>
                  </Flex>

                  {/* Club fee shown read-only for host awareness */}
                  {editingData.clubId && clubFee !== null && (
                    <Flex align="center" gap={3}>
                      <Text
                        fontSize="sm"
                        color={{ base: 'gray.600', _dark: 'gray.300' }}
                        fontWeight="medium"
                        w="90px"
                        flexShrink={0}
                      >
                        {t('clubFeePerSession')}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="green.600"
                      >
                        {clubFee.toLocaleString('vi-VN')} VNĐ / {t('session')}
                      </Text>
                    </Flex>
                  )}

                  <Text
                    fontSize="xs"
                    color={{ base: 'gray.500', _dark: 'gray.400' }}
                  >
                    💡 {t('clubFixedFeeHint')}
                  </Text>
                </>
              )}
            </VStack>
          )}
        </Box>
      </VStack>
    </VModal>
  );
};

export default EditPlayerModal;
