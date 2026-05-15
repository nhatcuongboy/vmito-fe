'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Flex, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { Button as CompatButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import { CourtService } from '@/lib/api/court.service';
import { CourtDirection } from '@/lib/api/types';
import { Court, Player } from '@/types/session';
import MatchCourtPreview from './MatchCourtPreview';

interface PreSelectedPlayerInfo {
  playerId: string;
  position: number;
  player?: Player;
}

interface PreSelectPreviewModalProps {
  isOpen: boolean;
  court: Court | null;
  onClose: () => void;
  onCancelPreSelect: (courtId: string) => Promise<void>;
  isCancelling?: boolean;
  courtColor?: string;
  getCourtDisplayName: (
    courtName: string | undefined,
    courtNumber: number
  ) => string;
}

const PreSelectPreviewModal: React.FC<PreSelectPreviewModalProps> = ({
  isOpen,
  court,
  onClose,
  onCancelPreSelect,
  isCancelling = false,
  courtColor,
  getCourtDisplayName,
}) => {
  const t = useTranslations('SessionDetail');
  const tCommon = useTranslations('common');
  const [preSelectedPlayers, setPreSelectedPlayers] = useState<
    PreSelectedPlayerInfo[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (!isOpen || !court?.id) {
      setPreSelectedPlayers([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadPreSelect = async () => {
      try {
        setIsLoading(true);
        const response = await CourtService.getPreSelect(court.id);
        if (isMounted) {
          setPreSelectedPlayers(response.preSelectedPlayers ?? []);
        }
      } catch (error) {
        console.error('Error loading pre-selected players:', error);
        if (isMounted) {
          setPreSelectedPlayers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPreSelect();

    return () => {
      isMounted = false;
    };
  }, [court?.id, isOpen]);

  const sortedPreSelectedPlayers = useMemo(
    () => [...preSelectedPlayers].sort((a, b) => a.position - b.position),
    [preSelectedPlayers]
  );

  const displayPlayers = useMemo(
    () =>
      sortedPreSelectedPlayers
        .map((entry) =>
          entry.player
            ? {
                ...entry.player,
                courtPosition: entry.position,
              }
            : null
        )
        .filter(Boolean) as Player[],
    [sortedPreSelectedPlayers]
  );

  const pairData = useMemo(() => {
    const direction = court?.direction || CourtDirection.HORIZONTAL;
    const mapping =
      direction === CourtDirection.HORIZONTAL ? [0, 2, 1, 3] : [0, 1, 2, 3];

    const entries = sortedPreSelectedPlayers.map((entry) => {
      const visualIndex = mapping[entry.position] ?? entry.position;
      // For horizontal direction (singles mode), pair is determined by left/right side
      // visualIndex 0,1 are on the left (pair 1), visualIndex 2,3 are on the right (pair 2)
      const pairNumber =
        direction === CourtDirection.HORIZONTAL
          ? visualIndex < 2
            ? 1
            : 2
          : visualIndex % 2 === 0
            ? 1
            : 2;
      return { ...entry, visualIndex, pairNumber };
    });

    const pair1 = entries
      .filter((entry) => entry.pairNumber === 1)
      .sort((a, b) => a.visualIndex - b.visualIndex);
    const pair2 = entries
      .filter((entry) => entry.pairNumber === 2)
      .sort((a, b) => a.visualIndex - b.visualIndex);

    const pair1Total = pair1.reduce(
      (sum, entry) => sum + (entry.player?.level ?? 0),
      0
    );
    const pair2Total = pair2.reduce(
      (sum, entry) => sum + (entry.player?.level ?? 0),
      0
    );

    return {
      pair1Players: pair1
        .map((entry) => entry.player)
        .filter((player): player is Player => !!player),
      pair2Players: pair2
        .map((entry) => entry.player)
        .filter((player): player is Player => !!player),
      gap: Math.abs(pair1Total - pair2Total),
    };
  }, [court?.direction, sortedPreSelectedPlayers]);

  const handleCancelPreSelect = async () => {
    if (!court) return;
    try {
      await onCancelPreSelect(court.id);
      setShowConfirmDialog(false);
      onClose();
    } catch (error) {
      console.error('Error cancelling pre-select:', error);
    }
  };

  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

  if (!isOpen || !court) return null;

  return (
    <>
      <VModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('courtsTab.nextMatchPreviewTitle', {
          courtNumber: court.courtNumber,
        })}
        description={t('courtsTab.nextMatchPreviewDescription')}
        size="xl"
        footer={
          <Flex gap={2} justify="flex-end" width="full">
            <CompatButton
              variant="outline"
              colorPalette="gray"
              onClick={onClose}
            >
              {t('courtsTab.cancel')}
            </CompatButton>
            <CompatButton
              colorPalette="red"
              variant="solid"
              onClick={handleCancelClick}
              disabled={isLoading || sortedPreSelectedPlayers.length === 0}
            >
              {t('courtsTab.cancelPreSelect')}
            </CompatButton>
          </Flex>
        }
      >
        <VStack gap={4} align="stretch">
          <MatchCourtPreview
            players={displayPlayers}
            courtName={getCourtDisplayName(court.courtName, court.courtNumber)}
            courtNumber={court.courtNumber}
            courtColor={courtColor}
            direction={court.direction || CourtDirection.HORIZONTAL}
            pair1Players={!isLoading ? pairData.pair1Players : undefined}
            pair2Players={!isLoading ? pairData.pair2Players : undefined}
            scoreDifference={
              sortedPreSelectedPlayers.length > 0 ? pairData.gap : undefined
            }
          />

          {isLoading ? (
            <HStack gap={3} justify="center" py={2} color="fg.muted">
              <Spinner size="sm" />
              <Text fontSize="sm">
                {t('courtsTab.loadingPreSelectedPlayers')}
              </Text>
            </HStack>
          ) : sortedPreSelectedPlayers.length === 0 ? (
            <Text fontSize="sm" color="fg.muted" textAlign="center">
              {t('courtsTab.noPreSelectedPlayers')}
            </Text>
          ) : null}
        </VStack>
      </VModal>

      {/* Confirmation Dialog */}
      <VModal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title={t('courtsTab.confirmCancelPreSelectTitle')}
        size="sm"
        footer={
          <Flex gap={2} justify="flex-end" width="full">
            <CompatButton
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isCancelling}
            >
              {tCommon('cancel')}
            </CompatButton>
            <CompatButton
              colorPalette="red"
              onClick={handleCancelPreSelect}
              loading={isCancelling}
            >
              {tCommon('confirm')}
            </CompatButton>
          </Flex>
        }
      >
        <Text fontSize="sm" color="fg.muted">
          {t('courtsTab.confirmCancelPreSelectMessage')}
        </Text>
      </VModal>
    </>
  );
};

export default PreSelectPreviewModal;
