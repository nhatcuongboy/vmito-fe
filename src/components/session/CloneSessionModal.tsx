'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Field, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { BulkPlayerData, ISession, Player } from '@/lib/api/types';
import { PlayerService } from '@/lib/api/player.service';
import { SessionService } from '@/lib/api/session.service';
import { getSessionLocationName } from '@/utils/session-location';
import {
  buildSingleDayDateTime,
  buildSingleDayEndDateTime,
  formatDateOnly,
  formatTimeOnly,
} from '@/components/session/session-form/sessionFormUtils';
import { VDateTimeInput } from '@/components/ui/VDateTimeInput';
import { Input } from '@/components/ui/Input';
import { VModal } from '@/components/ui/VModal';
import { toaster } from '@/components/ui/toaster';

interface ICloneSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ISession;
  onCloned?: () => void | Promise<void>;
}

type TClonePhase = 'schedule' | 'players';

const mapPlayersForClone = (players: Player[]): BulkPlayerData[] => {
  const uniquePlayers = new Map(
    players
      .filter((player) => player.registrationStatus !== 'REJECTED')
      .map((player) => [player.id, player])
  );

  return Array.from(uniquePlayers.values()).map((player) => ({
    name: player.name,
    gender: player.gender,
    level: player.level,
    levelDescription: player.levelDescription,
    phone: player.phone,
    userId: player.userId,
    preFilledByHost: player.preFilledByHost,
    confirmedByPlayer: false,
    requireConfirmInfo: player.requireConfirmInfo,
    isClubMember: player.isClubMember,
    clubId: player.clubId,
  }));
};

export const CloneSessionModal = ({
  isOpen,
  onClose,
  session,
  onCloned,
}: ICloneSessionModalProps) => {
  const t = useTranslations('session.cloneModal');
  const tSession = useTranslations('session');
  const tCommon = useTranslations('common');
  const [sessionDate, setSessionDate] = useState(() =>
    formatDateOnly(new Date())
  );
  const [sessionName, setSessionName] = useState(session.name);
  const [startHour, setStartHour] = useState('');
  const [endHour, setEndHour] = useState('');
  const [phase, setPhase] = useState<TClonePhase>('schedule');
  const [clonedSessionId, setClonedSessionId] = useState<string>();
  const [playersToClone, setPlayersToClone] = useState<BulkPlayerData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isAddingPlayers, setIsAddingPlayers] = useState(false);
  const [hasPlayerLoadError, setHasPlayerLoadError] = useState(false);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setSessionDate(formatDateOnly(new Date()));
      setSessionName(session.name);
      setStartHour('');
      setEndHour('');
      setPhase('schedule');
      setClonedSessionId(undefined);
      setPlayersToClone([]);
      setHasPlayerLoadError(false);
      hasFinishedRef.current = false;
    }
  }, [isOpen, session.name]);

  const finishClone = async () => {
    if (hasFinishedRef.current) return;

    hasFinishedRef.current = true;
    onClose();
    await onCloned?.();
  };

  const loadSourcePlayers = async () => {
    try {
      setIsLoadingPlayers(true);
      setHasPlayerLoadError(false);
      const sourceSession = await SessionService.getSession(session.id);
      const sourcePlayers = [
        ...(session.players ?? []),
        ...(session.pendingPlayers ?? []),
        ...(sourceSession.players ?? []),
        ...(sourceSession.pendingPlayers ?? []),
      ];
      const mappedPlayers = mapPlayersForClone(sourcePlayers);
      setPlayersToClone(mappedPlayers);
    } catch (error) {
      console.error('Error loading source session players:', error);
      setHasPlayerLoadError(true);
      toaster.error({ title: t('errors.loadPlayersFailed') });
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handleStartTimeChange = (value: string) => {
    setStartHour(value);
    if (!value) {
      setEndHour('');
      return;
    }

    const startTime = buildSingleDayDateTime(sessionDate, value);
    const suggestedEndTime = new Date(startTime);
    suggestedEndTime.setMinutes(
      suggestedEndTime.getMinutes() + (session.sessionDuration || 120)
    );
    setEndHour(formatTimeOnly(suggestedEndTime));
  };

  const getValidationError = () => {
    if (!sessionName.trim()) return t('errors.nameRequired');
    if (!sessionDate || !startHour || !endHour) return t('errors.required');

    const start = new Date(buildSingleDayDateTime(sessionDate, startHour));
    const end = new Date(buildSingleDayEndDateTime(sessionDate, endHour));
    if (start <= new Date()) return t('errors.future');
    if (end <= start) return t('errors.endAfterStart');
    return null;
  };

  const handleClone = async () => {
    const validationError = getValidationError();
    if (validationError) {
      toaster.error({ title: validationError });
      return;
    }

    try {
      setIsSubmitting(true);
      const clonedSession = await SessionService.cloneSession(session.id, {
        name: sessionName.trim(),
        startTime: new Date(
          buildSingleDayDateTime(sessionDate, startHour)
        ).toISOString(),
        endTime: new Date(
          buildSingleDayEndDateTime(sessionDate, endHour)
        ).toISOString(),
      });
      setClonedSessionId(clonedSession.id);
      setPhase('players');
      toaster.success({ title: t('success') });
    } catch (error) {
      console.error('Error cloning session:', error);
      toaster.error({ title: t('errors.failed') });
      return;
    } finally {
      setIsSubmitting(false);
    }

    await loadSourcePlayers();
  };

  const handleAddPlayers = async () => {
    if (!clonedSessionId || playersToClone.length === 0) return;

    try {
      setIsAddingPlayers(true);
      await PlayerService.createBulkPlayers(clonedSessionId, playersToClone);
      toaster.success({
        title: t('playersAddedSuccess', { count: playersToClone.length }),
      });
      await finishClone();
    } catch (error) {
      console.error('Error adding players to cloned session:', error);
      toaster.error({ title: t('errors.addPlayersFailed') });
    } finally {
      setIsAddingPlayers(false);
    }
  };

  const handleModalClose = () => {
    if (isSubmitting || isLoadingPlayers || isAddingPlayers) return;

    if (phase === 'players' && clonedSessionId) {
      void finishClone();
      return;
    }

    onClose();
  };

  const isPlayerPhase = phase === 'players';
  const isBusy = isSubmitting || isLoadingPlayers || isAddingPlayers;
  const sourcePlayerCount =
    (session.players?.length ?? 0) + (session.pendingPlayers?.length ?? 0) ||
    session._count?.players ||
    0;
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const locationName =
    getSessionLocationName(session) || tCommon('notAvailable');
  const previewDuration =
    sessionDate && startHour && endHour
      ? Math.round(
          (new Date(buildSingleDayEndDateTime(sessionDate, endHour)).getTime() -
            new Date(
              buildSingleDayDateTime(sessionDate, startHour)
            ).getTime()) /
            60000
        )
      : session.sessionDuration;

  return (
    <VModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={t(isPlayerPhase ? 'playerPromptTitle' : 'title')}
      description={
        isPlayerPhase
          ? t('playerPromptDescription', { count: playersToClone.length })
          : t('description', { name: session.name })
      }
      size="lg"
      primaryActionText={t(
        isPlayerPhase
          ? hasPlayerLoadError
            ? 'retryPlayers'
            : 'addPlayers'
          : 'confirm'
      )}
      secondaryActionText={isPlayerPhase ? t('skipPlayers') : tCommon('cancel')}
      isPrimaryLoading={isBusy}
      isPrimaryDisabled={
        isPlayerPhase
          ? isLoadingPlayers ||
            (!hasPlayerLoadError && playersToClone.length === 0)
          : !sessionName.trim() || !sessionDate || !startHour || !endHour
      }
      onPrimaryAction={
        isPlayerPhase
          ? hasPlayerLoadError
            ? loadSourcePlayers
            : handleAddPlayers
          : handleClone
      }
      onSecondaryAction={isPlayerPhase ? finishClone : onClose}
      isSecondaryDisabled={isBusy}
      closeOnOverlayClick={!isBusy}
    >
      {isPlayerPhase ? (
        <Box
          bg={hasPlayerLoadError ? 'red.50' : 'blue.50'}
          borderWidth="1px"
          borderColor={hasPlayerLoadError ? 'red.200' : 'blue.200'}
          p={4}
        >
          <Text
            fontSize="sm"
            color={hasPlayerLoadError ? 'red.800' : 'blue.800'}
          >
            {isLoadingPlayers
              ? tCommon('loading')
              : hasPlayerLoadError
                ? t('errors.loadPlayersFailed')
                : playersToClone.length === 0
                  ? t('noPlayers')
                  : t('playerPromptDetails', {
                      count: playersToClone.length,
                    })}
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={4}>
          <Field.Root required invalid={!sessionName.trim()}>
            <Field.Label>{t('sessionName')}</Field.Label>
            <Input
              value={sessionName}
              placeholder={t('sessionNamePlaceholder')}
              onChange={(event) => setSessionName(event.target.value)}
            />
            <Field.ErrorText>{t('errors.nameRequired')}</Field.ErrorText>
          </Field.Root>

          <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
            <Box flex={1}>
              <Field.Root required>
                <Field.Label>{tSession('date')}</Field.Label>
                <VDateTimeInput
                  type="date"
                  value={sessionDate}
                  min={formatDateOnly(new Date())}
                  color="fg"
                  bg="bg"
                  _dark={{ color: 'white', bg: 'gray.700' }}
                  placeholder={tSession('date')}
                  onChange={(event) => setSessionDate(event.target.value)}
                />
              </Field.Root>
            </Box>

            <Stack direction="row" gap={4} flex={2}>
              <Box flex={1}>
                <Field.Root required>
                  <Field.Label>{tSession('start')}</Field.Label>
                  <VDateTimeInput
                    type="time"
                    value={startHour}
                    color="fg"
                    bg="bg"
                    _dark={{ color: 'white', bg: 'gray.700' }}
                    placeholder={tSession('start')}
                    onChange={(event) =>
                      handleStartTimeChange(event.target.value)
                    }
                  />
                </Field.Root>
              </Box>

              <Box flex={1}>
                <Field.Root required>
                  <Field.Label>{tSession('end')}</Field.Label>
                  <VDateTimeInput
                    type="time"
                    value={endHour}
                    color="fg"
                    bg="bg"
                    _dark={{ color: 'white', bg: 'gray.700' }}
                    placeholder={tSession('end')}
                    onChange={(event) => setEndHour(event.target.value)}
                  />
                </Field.Root>
              </Box>
            </Stack>
          </Stack>

          <Box borderWidth="1px" borderColor="border" p={4}>
            <Text fontSize="sm" fontWeight="semibold" color="fg" mb={3}>
              {t('previewTitle')}
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gapX={6} gapY={3}>
              <Box>
                <Text fontSize="xs" color="fg.muted">
                  {t('preview.location')}
                </Text>
                <Text fontSize="sm" color="fg" lineClamp={2}>
                  {locationName}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="fg.muted">
                  {t('preview.courts')}
                </Text>
                <Text fontSize="sm" color="fg">
                  {t('preview.courtsValue', {
                    count: session.numberOfCourts,
                  })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="fg.muted">
                  {t('preview.capacity')}
                </Text>
                <Text fontSize="sm" color="fg">
                  {t('preview.playersValue', { count: maxPlayers })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="fg.muted">
                  {t('preview.registeredPlayers')}
                </Text>
                <Text fontSize="sm" color="fg">
                  {t('preview.playersValue', { count: sourcePlayerCount })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="fg.muted">
                  {t('preview.duration')}
                </Text>
                <Text fontSize="sm" color="fg">
                  {t('preview.minutesValue', {
                    count: previewDuration,
                  })}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="fg.muted">
                  {t('preview.playersPerCourt')}
                </Text>
                <Text fontSize="sm" color="fg">
                  {t('preview.playersValue', {
                    count: session.maxPlayersPerCourt,
                  })}
                </Text>
              </Box>
            </SimpleGrid>
          </Box>

          <Box bg="blue.50" borderWidth="1px" borderColor="blue.200" p={3}>
            <Text fontSize="sm" color="blue.800">
              {t('excludedData')}
            </Text>
          </Box>
        </VStack>
      )}
    </VModal>
  );
};
