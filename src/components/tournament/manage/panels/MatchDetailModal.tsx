'use client';

import { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/ChakraModal';
import { useTranslations } from 'next-intl';
import {
  CalendarClock,
  CalendarDays,
  MapPin,
  MoreVertical,
  NotebookText,
  RotateCcw,
  Shield,
  SquarePen,
  Trash2,
  Trophy,
  UserRound,
} from 'lucide-react';

import {
  Category,
  CategoryMatch,
  MatchStatus,
  SportType,
  UserRole,
} from '@/lib/api/types';
import { resolveMatchSideLabel } from '@/lib/tournament/bracketSlots';
import { areMatchParticipantsResolved } from '@/lib/tournament/teamLabel';
import { usePlayoffSlotLabels } from '@/lib/tournament/usePlayoffSlotLabels';
import { getMatchDisplayCode } from '@/lib/tournament/codes';
import { formatTimeByDevicePreference } from '@/utils/time-helpers';
import MatchFormatBadges from '@/components/tournament/MatchFormatBadges';
import { useRouter } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  categoryName: string;
  /** Pre-resolved group name or round label (e.g. "Pool A", "Semi Finals"). */
  roundOrGroupLabel: string;
  /** Pre-formatted court label (e.g. "R · Court 1"). */
  courtLabel?: string;
  /** All category matches, used to resolve empty elimination slots to feeders. */
  allMatches?: CategoryMatch[];
  /** The match's category, used to resolve first-round seed labels. */
  category?: Category;
  /** Tournament sport, so scoring defaults match the sport (e.g. pickleball 11). */
  sportType?: SportType | null;
  /** When true, render joined player full names instead of pair/team name. */
  showPlayerNames?: boolean;
  canEdit: boolean;
  onEditResult: (match: CategoryMatch) => void;
  onDeleteMatch: (match: CategoryMatch) => void;
  onResetResult?: (match: CategoryMatch) => void;
  /** Open the scheduling sheet (time, court, referee) for this match. */
  onSchedule?: (match: CategoryMatch) => void;
  /** Tournament ID used to build the referee scoring page link. */
  tournamentId?: string;
}

export default function MatchDetailModal({
  isOpen,
  onClose,
  match,
  categoryName,
  roundOrGroupLabel,
  courtLabel,
  allMatches,
  category,
  sportType,
  showPlayerNames,
  canEdit,
  onEditResult,
  onDeleteMatch,
  onResetResult,
  onSchedule,
  tournamentId,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const slotLabels = usePlayoffSlotLabels();
  const [optionsOpen, setOptionsOpen] = useState(false);

  // Reset transient UI each time the modal is opened or the match changes.
  useEffect(() => {
    if (!isOpen) {
      setOptionsOpen(false);
      return;
    }
    setOptionsOpen(false);
  }, [isOpen, match?.id]);

  if (!match) return null;

  const labelCtx = {
    allMatches: allMatches ?? [],
    category,
    labels: slotLabels,
    showPlayerNames,
  };
  const team1 = resolveMatchSideLabel(match, 1, labelCtx);
  const team2 = resolveMatchSideLabel(match, 2, labelCtx);
  const participantsResolved = areMatchParticipantsResolved(match);
  const score1 = totalScore(match, 1);
  const score2 = totalScore(match, 2);
  const win1 = isWinner(match, 1);
  const win2 = isWinner(match, 2);
  const canResetResult = onResetResult && hasResettableResult(match);
  const isAssignedReferee =
    !!match.referee?.userId && match.referee.userId === currentUser?.id;
  const canReferee =
    tournamentId &&
    currentUser &&
    currentUser.role !== UserRole.GUEST &&
    (canEdit || isAssignedReferee);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalCloseButton onClose={onClose} />
      <ModalHeader>
        <Text fontSize="lg" fontWeight="bold">
          {t('matchDetail.title')}
        </Text>
        <Text
          fontSize="sm"
          fontWeight="medium"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
        >
          {getMatchDisplayCode(match)} · {roundOrGroupLabel}
        </Text>
        <Box mt={2}>
          <MatchFormatBadges
            match={match}
            category={category}
            sportType={sportType}
          />
        </Box>
      </ModalHeader>

      <ModalBody>
        <MatchupHeader team1={team1} team2={team2} win1={win1} win2={win2} />

        <ScoreBar score1={score1} score2={score2} label={t('points')} />

        <DetailsTab
          match={match}
          categoryName={categoryName}
          roundOrGroupLabel={roundOrGroupLabel}
          courtLabel={courtLabel}
        />
      </ModalBody>

      {(canEdit || canReferee) && (
        <ModalFooter pt={4}>
          <Flex wrap="wrap" gap={2} w="full">
            {canEdit && (
              <Button
                flex="1"
                minW="calc(50% - 4px)"
                variant="solid"
                colorPalette="blue"
                onClick={() => onEditResult(match)}
                disabled={!participantsResolved}
                title={
                  participantsResolved
                    ? undefined
                    : t('matchDetail.awaitingFeeders')
                }
              >
                <SquarePen size={16} /> {t('matchDetail.editResult')}
              </Button>
            )}

            {canReferee && (
              <Button
                flex="1"
                minW="calc(50% - 4px)"
                variant="solid"
                colorPalette="green"
                onClick={() =>
                  router.push(
                    `/tournament/${tournamentId}/referee/${match.id}` as never
                  )
                }
              >
                <Shield size={16} /> {t('matchDetail.referee')}
              </Button>
            )}

            {canEdit && onSchedule && (
              <Button
                flex="1"
                minW="calc(50% - 4px)"
                variant="outline"
                colorPalette="gray"
                onClick={() => onSchedule(match)}
              >
                <CalendarClock size={16} /> {t('matchDetail.schedule')}
              </Button>
            )}

            {canEdit && (
              <Box position="relative" flex="1" minW="calc(50% - 4px)">
                <Button
                  w="full"
                  variant="outline"
                  colorPalette="gray"
                  onClick={() => setOptionsOpen((open) => !open)}
                >
                  <MoreVertical size={16} /> {t('matchDetail.matchOptions')}
                </Button>
                {optionsOpen && (
                  <Box
                    position="absolute"
                    bottom="calc(100% + 8px)"
                    right={0}
                    minW="180px"
                    bg="white"
                    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    boxShadow="lg"
                    p={1}
                    zIndex={10}
                  >
                    {canResetResult && (
                      <Button
                        w="full"
                        variant="ghost"
                        colorPalette="red"
                        color="red.500"
                        justifyContent="flex-start"
                        onClick={() => {
                          setOptionsOpen(false);
                          onResetResult(match);
                        }}
                      >
                        <RotateCcw size={14} /> {t('matchDetail.resetResult')}
                      </Button>
                    )}
                    <Button
                      w="full"
                      variant="ghost"
                      colorPalette="red"
                      color="red.500"
                      justifyContent="flex-start"
                      onClick={() => {
                        setOptionsOpen(false);
                        onDeleteMatch(match);
                      }}
                    >
                      <Trash2 size={14} /> {t('deleteMatch')}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Flex>
        </ModalFooter>
      )}
    </Modal>
  );
}

function DetailsTab({
  match,
  categoryName,
  roundOrGroupLabel,
  courtLabel,
}: {
  match: CategoryMatch;
  categoryName: string;
  roundOrGroupLabel: string;
  courtLabel?: string;
}) {
  const start = match.startTime ? new Date(match.startTime) : null;
  const refereeName = match.refereeName?.trim();
  const assignedRefereeName = match.referee?.name?.trim();
  const notes = match.notes?.trim();
  const hasRefereeDetails = Boolean(refereeName || notes);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <InfoRow icon={<RotateCcw size={18} />} title={roundOrGroupLabel}>
        {categoryName}
      </InfoRow>

      {start && (
        <InfoRow
          icon={<CalendarDays size={18} />}
          title={formatTimeByDevicePreference(start)}
        >
          {start.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </InfoRow>
      )}

      {courtLabel && <InfoRow icon={<MapPin size={18} />} title={courtLabel} />}

      {hasRefereeDetails && (
        <RefereeInfoPanel
          refereeName={refereeName || assignedRefereeName}
          isAssignedFallback={!refereeName && Boolean(assignedRefereeName)}
          notes={notes}
        />
      )}
    </Box>
  );
}

function RefereeInfoPanel({
  refereeName,
  isAssignedFallback,
  notes,
}: {
  refereeName?: string;
  isAssignedFallback?: boolean;
  notes?: string;
}) {
  const t = useTranslations('pages.tournaments.manualScore.matchDetail');

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="gray.50"
      p={3}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <Text
        fontSize="sm"
        fontWeight="bold"
        color="gray.700"
        mb={3}
        _dark={{ color: 'gray.200' }}
      >
        {t('refereeInfo')}
      </Text>
      <Box display="flex" flexDirection="column" gap={3}>
        {refereeName && (
          <RefereeInfoRow
            icon={<UserRound size={16} />}
            label={isAssignedFallback ? t('assignedReferee') : t('refereeName')}
          >
            {refereeName}
          </RefereeInfoRow>
        )}
        {notes && (
          <RefereeInfoRow icon={<NotebookText size={16} />} label={t('notes')}>
            <Text whiteSpace="pre-wrap" wordBreak="break-word">
              {notes}
            </Text>
          </RefereeInfoRow>
        )}
      </Box>
    </Box>
  );
}

function RefereeInfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Flex align="start" gap={2.5}>
      <Flex
        align="center"
        justify="center"
        w="30px"
        h="30px"
        flexShrink={0}
        borderRadius="lg"
        bg="white"
        color="gray.600"
        _dark={{ bg: 'gray.900', color: 'gray.300' }}
      >
        {icon}
      </Flex>
      <Box minW={0}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.500"
          _dark={{ color: 'gray.400' }}
        >
          {label}
        </Text>
        <Box mt={0.5} fontWeight="semibold">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

function MatchupHeader({
  team1,
  team2,
  win1,
  win2,
}: {
  team1: string;
  team2: string;
  win1: boolean;
  win2: boolean;
}) {
  return (
    <Box mb={3}>
      <Flex align="stretch" gap={{ base: 2, sm: 3 }} minW={0}>
        <MatchupTeamCard label={team1} highlight={win1} align="left" />

        <Flex
          align="center"
          justify="center"
          flexShrink={0}
          px={{ base: 1, sm: 2 }}
        >
          <Text
            fontSize="xs"
            fontWeight="black"
            color="gray.400"
            letterSpacing="0"
            _dark={{ color: 'gray.500' }}
          >
            VS
          </Text>
        </Flex>

        <MatchupTeamCard label={team2} highlight={win2} align="right" />
      </Flex>
    </Box>
  );
}

function ScoreBar({
  score1,
  score2,
  label,
}: {
  score1?: number;
  score2?: number;
  label: string;
}) {
  const total1 = score1 ?? 0;
  const total2 = score2 ?? 0;
  const sum = total1 + total2;
  const pct1 = sum > 0 ? (total1 / sum) * 100 : 50;

  return (
    <Box mb={4}>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="black" fontSize="lg">
          {total1}
        </Text>
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="gray.600"
          _dark={{ color: 'gray.300' }}
        >
          {label}
        </Text>
        <Text fontWeight="black" fontSize="lg">
          {total2}
        </Text>
      </Flex>
      <Flex
        h="8px"
        borderRadius="full"
        overflow="hidden"
        bg="gray.100"
        _dark={{ bg: 'gray.700' }}
      >
        <Box w={`${pct1}%`} bg="yellow.400" />
        <Box flex="1" bg="yellow.200" />
      </Flex>
    </Box>
  );
}

function MatchupTeamCard({
  label,
  highlight,
  align,
}: {
  label: string;
  highlight: boolean;
  align: 'left' | 'right';
}) {
  const nameLines = splitTeamLabel(label);

  return (
    <Flex
      flex="1"
      minW={0}
      align="stretch"
      justify="center"
      gap={2}
      px={{ base: 3, sm: 4 }}
      py={3}
      borderWidth="1px"
      borderColor={highlight ? 'green.300' : 'gray.200'}
      borderRadius="xl"
      bg={highlight ? 'green.50' : 'gray.50'}
      _dark={{
        borderColor: highlight ? 'green.700' : 'gray.700',
        bg: highlight ? 'green.900/20' : 'gray.800',
      }}
    >
      {highlight && (
        <Flex
          align="center"
          justify="center"
          order={align === 'right' ? 2 : 0}
          flexShrink={0}
        >
          <Trophy size={16} color="var(--chakra-colors-green-500)" />
        </Flex>
      )}
      <Box flex="1" minW={0} textAlign={align}>
        {nameLines.map((line, index) => (
          <Text
            key={`${line}-${index}`}
            fontSize={{ base: 'md', sm: 'lg' }}
            fontWeight={highlight ? 'black' : 'bold'}
            lineHeight={1.15}
            whiteSpace="normal"
            overflowWrap="anywhere"
            wordBreak="break-word"
          >
            {line}
          </Text>
        ))}
      </Box>
    </Flex>
  );
}

function splitTeamLabel(label: string) {
  return label
    .split(/\s+\/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function InfoRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <Flex align="center" gap={3}>
      <Flex
        align="center"
        justify="center"
        w="44px"
        h="44px"
        flexShrink={0}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        color="gray.600"
        _dark={{ borderColor: 'gray.700', color: 'gray.300' }}
      >
        {icon}
      </Flex>
      <Box minW={0}>
        <Text fontWeight="semibold" lineClamp={1}>
          {title}
        </Text>
        {children && (
          <Text
            fontSize="sm"
            color="gray.500"
            lineClamp={1}
            _dark={{ color: 'gray.400' }}
          >
            {children}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function regId(match: CategoryMatch, position: 1 | 2) {
  return match.participants?.find((item) => item.position === position)
    ?.categoryRegistrationId;
}

function lastSetScore(match: CategoryMatch, side: 1 | 2) {
  const lastSet = match.sets?.[match.sets.length - 1];
  if (!lastSet) return undefined;
  return side === 1 ? lastSet.player1Score : lastSet.player2Score;
}

function totalScore(match: CategoryMatch, side: 1 | 2) {
  const direct = side === 1 ? match.player1Score : match.player2Score;
  if (direct !== undefined && direct !== null) return direct;
  return lastSetScore(match, side);
}

function isWinner(match: CategoryMatch, side: 1 | 2) {
  return !!match.winnerId && match.winnerId === regId(match, side);
}

function hasResettableResult(match: CategoryMatch) {
  return (
    match.status === MatchStatus.IN_PROGRESS ||
    match.status === MatchStatus.FINISHED ||
    match.status === MatchStatus.CANCELLED ||
    !!match.score ||
    !!match.winnerId ||
    !!match.isForfeit ||
    (match.sets?.length ?? 0) > 0
  );
}
