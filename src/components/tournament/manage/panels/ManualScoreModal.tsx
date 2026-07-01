'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button, Input } from '@/components/ui/chakra-compat';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@/components/ui/ChakraModal';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Flag,
  Minus,
  Plus,
  Send,
  Trophy,
} from 'lucide-react';

import { CategoryService } from '@/lib/api/category.service';
import {
  CategoryMatch,
  EndCategoryMatchRequest,
  MatchSet,
  SportType,
} from '@/lib/api/types';
import {
  getTeamLabel,
  areMatchParticipantsResolved,
} from '@/lib/tournament/teamLabel';
import { getRoundDisplayLabel } from '@/lib/tournament/roundLabel';
import MatchFormatBadges from '@/components/tournament/MatchFormatBadges';
import {
  defaultRules,
  isMatchComplete,
  isSetComplete,
  setsToWin,
  setWins,
  buildScoreString,
} from '@/lib/scoring/badminton';

type ResultMode = 'score' | 'forfeit' | 'manual';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  onSaved: (m: CategoryMatch) => void;
  /** Category points mode; enables the manual-points tab when 'manual'. */
  pointsEarning?: 'match_results' | 'manual' | 'tiebreakers_only';
  /** Tournament sport, so scoring defaults match the sport (e.g. pickleball 11). */
  sportType?: SportType | null;
  /** When provided, renders a Back button that returns to the previous modal. */
  onBack?: () => void;
}

interface SetInput {
  player1Score: string;
  player2Score: string;
}

const emptySet = (): SetInput => ({ player1Score: '', player2Score: '' });

const toNum = (raw: string): number => {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export default function ManualScoreModal({
  isOpen,
  onClose,
  match,
  onSaved,
  pointsEarning,
  sportType,
  onBack,
}: Props) {
  const t = useTranslations('pages.tournaments.manualScore');
  const tRounds = useTranslations('pages.tournaments.manualScore.rounds');
  const [sets, setSets] = useState<SetInput[]>([]);
  const [mode, setMode] = useState<ResultMode>('score');
  const [forfeitWinner, setForfeitWinner] = useState<1 | 2 | null>(null);
  const [manual1, setManual1] = useState('');
  const [manual2, setManual2] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allowManual = pointsEarning === 'manual';

  const rules = useMemo(
    () =>
      match ? defaultRules(match, sportType) : defaultRules(null, sportType),
    [match, sportType]
  );
  const maxSets = rules.bestOf;
  // Maximum allowed score per side. With a hard cap use the cap. Without a
  // cap and "win by 2" deuce, going above pointsToWin is only valid when the
  // other side is also in deuce territory — that is handled per-input in
  // updateScore. Use pointsToWin as the base UI hint.
  const maxScore = rules.cap ?? rules.pointsToWin;
  // Always start with a single set; users can add more via the Add Set button.
  const minSets = 1;

  const isDoubles =
    match?.participants?.some((p) => p.categoryRegistration?.pair) ?? false;

  const regIdOfPosition = (pos: number) =>
    match?.participants?.find((p) => p.position === pos)
      ?.categoryRegistrationId;

  // Seed inputs + default mode from the existing match each time it opens.
  useEffect(() => {
    if (!isOpen || !match) return;

    const existing = (match.sets ?? []).map<SetInput>((s) => ({
      player1Score: String(s.player1Score),
      player2Score: String(s.player2Score),
    }));
    setSets(
      existing.length >= minSets
        ? existing
        : Array.from({ length: minSets }, emptySet)
    );

    const winnerPos =
      match.winnerId ===
      match.participants?.find((p) => p.position === 1)?.categoryRegistrationId
        ? 1
        : match.winnerId ===
            match.participants?.find((p) => p.position === 2)
              ?.categoryRegistrationId
          ? 2
          : null;

    setManual1(match.player1Points != null ? String(match.player1Points) : '');
    setManual2(match.player2Points != null ? String(match.player2Points) : '');

    if (match.isForfeit) {
      setMode('forfeit');
      setForfeitWinner(winnerPos);
    } else if (match.player1Points != null || match.player2Points != null) {
      setMode('manual');
      setForfeitWinner(null);
    } else {
      setMode(allowManual ? 'manual' : 'score');
      setForfeitWinner(null);
    }
  }, [isOpen, match, minSets, allowManual]);

  if (!match) return null;

  const team1 = getTeamLabel(match, 1);
  const team2 = getTeamLabel(match, 2);
  const roundLabel = getRoundDisplayLabel(match.round, tRounds);
  const participantsResolved = areMatchParticipantsResolved(match);

  const matchSets: MatchSet[] = sets.map((s, i) => ({
    setNumber: i + 1,
    player1Score: toNum(s.player1Score),
    player2Score: toNum(s.player2Score),
  }));
  const { complete, winnerSide } = isMatchComplete(matchSets, rules);
  const winnerName = winnerSide === 1 ? team1 : winnerSide === 2 ? team2 : null;

  const manual1Num = toNum(manual1);
  const manual2Num = toNum(manual2);
  const manualWinner =
    manual1Num > manual2Num ? 1 : manual2Num > manual1Num ? 2 : null;

  const canSave =
    participantsResolved &&
    (mode === 'score'
      ? complete && !!winnerSide
      : mode === 'forfeit'
        ? forfeitWinner !== null
        : true); // manual: 0-0 is a valid draw

  const updateScore = (index: number, side: 1 | 2, raw: string) => {
    // Allow empty string so the input doesn't auto-fill 0.
    let sanitized = raw.replace(/[^0-9]/g, '');
    if (sanitized !== '') {
      const entered = Number(sanitized);
      if (rules.cap != null) {
        // Hard cap: clamp to cap.
        if (entered > rules.cap) sanitized = String(rules.cap);
      } else if (entered > rules.pointsToWin) {
        // No hard cap: a score above pointsToWin is only reachable in deuce,
        // which requires the other side to be within (winBy - 1) of pointsToWin.
        const otherKey = side === 1 ? 'player2Score' : 'player1Score';
        const otherScore = toNum(sets[index]?.[otherKey] ?? '');
        const deuceThreshold = rules.pointsToWin - (rules.winBy - 1);
        if (rules.winBy < 2 || otherScore < deuceThreshold) {
          sanitized = String(rules.pointsToWin);
        }
      }
    }
    setSets((prev) => {
      const next = prev.map((s, i) =>
        i === index
          ? {
              ...s,
              [side === 1 ? 'player1Score' : 'player2Score']: sanitized,
            }
          : s
      );
      // Auto-add the next set when the last set is complete but the match
      // isn't yet decided — saves the user from clicking "Add set".
      const isLast = index === next.length - 1;
      if (isLast && next.length < maxSets) {
        const last = next[next.length - 1];
        const a = toNum(last.player1Score);
        const b = toNum(last.player2Score);
        if (isSetComplete(a, b, rules).complete) {
          const projected: MatchSet[] = next.map((s, i) => ({
            setNumber: i + 1,
            player1Score: toNum(s.player1Score),
            player2Score: toNum(s.player2Score),
          }));
          if (!isMatchComplete(projected, rules).complete) {
            return [...next, emptySet()];
          }
        }
      }
      return next;
    });
  };

  const addSet = () => setSets((prev) => [...prev, emptySet()]);
  const removeLatestSet = () => setSets((prev) => prev.slice(0, -1));

  const buildPayload = (): EndCategoryMatchRequest | null => {
    if (mode === 'forfeit') {
      if (!forfeitWinner) return null;
      return {
        score: t('walkover'),
        isForfeit: true,
        winnerId: regIdOfPosition(forfeitWinner),
        player1Score: 0,
        player2Score: 0,
        sets: [],
      };
    }
    if (mode === 'manual') {
      return {
        score: `${manual1Num} - ${manual2Num}`,
        player1Points: manual1Num,
        player2Points: manual2Num,
        winnerId: manualWinner ? regIdOfPosition(manualWinner) : undefined,
        isDraw: manualWinner === null,
      };
    }
    // score
    if (!complete || !winnerSide) return null;
    const played = matchSets.filter(
      (s, i) => i === 0 || s.player1Score > 0 || s.player2Score > 0
    );
    const total1 = played.reduce((sum, s) => sum + s.player1Score, 0);
    const total2 = played.reduce((sum, s) => sum + s.player2Score, 0);
    return {
      score: buildScoreString(played),
      sets: played,
      winnerId: winnerSide === 1 ? regIdOfPosition(1) : regIdOfPosition(2),
      player1Score: total1,
      player2Score: total2,
      ...(isDoubles && { player3Score: total1, player4Score: total2 }),
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSubmitting(true);
    try {
      const resp = await CategoryService.endMatch(match.id, payload);
      onSaved(resp);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const modes: ResultMode[] = allowManual
    ? ['score', 'forfeit', 'manual']
    : ['score', 'forfeit'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader pb={3}>
        <Text fontSize="2xl" fontWeight="bold" lineHeight="1.2">
          {t('title')}
        </Text>
        <Text mt={2} fontSize="sm" color="gray.500" fontWeight="medium">
          #{match.matchNumber} · {roundLabel}
        </Text>
        <Box mt={3}>
          <MatchFormatBadges match={match} sportType={sportType} />
        </Box>
      </ModalHeader>
      <ModalCloseButton onClose={onClose} />
      <ModalBody p={{ base: 4, md: 5 }}>
        {!participantsResolved && (
          <Box
            mb={4}
            px={4}
            py={3}
            borderRadius="lg"
            bg="orange.50"
            color="orange.800"
            borderWidth="1px"
            borderColor="orange.200"
            _dark={{
              bg: 'orange.900',
              color: 'orange.100',
              borderColor: 'orange.700',
            }}
          >
            <Text fontSize="sm">{t('matchDetail.awaitingFeeders')}</Text>
          </Box>
        )}
        <Flex
          gap={2}
          mb={5}
          p={1}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="lg"
          bg="gray.50"
          _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
        >
          {modes.map((m) => (
            <Button
              key={m}
              size="sm"
              flex="1"
              variant={mode === m ? 'solid' : 'outline'}
              colorPalette={mode === m ? 'blue' : 'gray'}
              onClick={() => setMode(m)}
              leftIcon={
                m === 'score' ? (
                  <Send size={14} />
                ) : m === 'forfeit' ? (
                  <Flag size={14} />
                ) : (
                  <Trophy size={14} />
                )
              }
            >
              {t(
                m === 'score'
                  ? 'modeScore'
                  : m === 'forfeit'
                    ? 'modeForfeit'
                    : 'modeManual'
              )}
            </Button>
          ))}
        </Flex>

        {mode === 'score' && (
          <>
            <Flex align="center" gap={2} mb={2}>
              <Text flex="0 0 72px" fontSize="sm" color="gray.500" />
              <Text
                flex="1"
                textAlign="center"
                fontSize="sm"
                color="gray.600"
                fontWeight="semibold"
                truncate
              >
                {team1}
              </Text>
              <Text flex="0 0 18px" />
              <Text
                flex="1"
                textAlign="center"
                fontSize="sm"
                color="gray.600"
                fontWeight="semibold"
                truncate
              >
                {team2}
              </Text>
              <Box flex="0 0 24px" />
            </Flex>
            {sets.map((s, i) => {
              const a = toNum(s.player1Score);
              const b = toNum(s.player2Score);
              const hasInput = s.player1Score !== '' || s.player2Score !== '';
              const setDone = isSetComplete(a, b, rules).complete;
              return (
                <Flex key={i} align="center" gap={2} mb={3}>
                  <Text fontSize="sm" color="gray.500" flex="0 0 72px">
                    {t('set')} {i + 1}
                  </Text>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={maxScore}
                    placeholder="0"
                    value={s.player1Score}
                    onChange={(e) => updateScore(i, 1, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    textAlign="center"
                    h="48px"
                    fontSize="lg"
                    fontWeight="semibold"
                  />
                  <Text color="gray.400" flex="0 0 18px" textAlign="center">
                    -
                  </Text>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={maxScore}
                    placeholder="0"
                    value={s.player2Score}
                    onChange={(e) => updateScore(i, 2, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    textAlign="center"
                    h="48px"
                    fontSize="lg"
                    fontWeight="semibold"
                  />
                  <Flex
                    flex="0 0 24px"
                    justify="center"
                    align="center"
                    color={
                      setDone
                        ? 'green.500'
                        : hasInput
                          ? 'orange.400'
                          : 'transparent'
                    }
                  >
                    {setDone ? (
                      <CheckCircle2 size={20} aria-label={t('setValid')} />
                    ) : hasInput ? (
                      <AlertCircle size={20} aria-label={t('setIncomplete')} />
                    ) : null}
                  </Flex>
                </Flex>
              );
            })}

            <Flex gap={3} mt={2}>
              <Button
                flex="1"
                size="md"
                variant="outline"
                colorPalette="green"
                onClick={addSet}
                disabled={sets.length >= maxSets}
                leftIcon={<Plus size={16} />}
              >
                {t('addSet')}
              </Button>
              <Button
                flex="1"
                size="md"
                variant="outline"
                colorPalette="gray"
                onClick={removeLatestSet}
                disabled={sets.length <= minSets}
                leftIcon={<Minus size={16} />}
              >
                {t('removeSet')}
              </Button>
            </Flex>

            <ResultBox tone={complete && winnerName ? 'success' : 'warning'}>
              {complete && winnerName ? (
                <Flex justify="center" align="center" gap={2} wrap="wrap">
                  <Trophy size={18} />
                  <Text>
                    {t('winner')}:{' '}
                    <Text as="span" fontWeight="bold">
                      {winnerName}
                    </Text>{' '}
                    <Text as="span" color="gray.500">
                      ({buildScoreString(matchSets)})
                    </Text>
                  </Text>
                </Flex>
              ) : (
                <Flex direction="column" gap={1} align="center">
                  <Text fontSize="sm">{t('noWinnerYet')}</Text>
                  {(() => {
                    const need = setsToWin(rules);
                    if (need <= 1) return null;
                    const { side1, side2 } = setWins(matchSets, rules);
                    const won = Math.max(side1, side2);
                    return (
                      <Text fontSize="xs" color="gray.600">
                        {side1 === side2
                          ? t('setsProgressTied', {
                              side1,
                              side2,
                              need,
                            })
                          : t('setsProgress', {
                              won,
                              need,
                              bestOf: rules.bestOf,
                            })}
                      </Text>
                    );
                  })()}
                </Flex>
              )}
            </ResultBox>
          </>
        )}

        {mode === 'forfeit' && (
          <>
            <Text fontSize="sm" color="gray.500" mb={2}>
              {t('selectWinner')}
            </Text>
            <Flex gap={2}>
              {([1, 2] as const).map((pos) => (
                <Button
                  key={pos}
                  flex="1"
                  minH="48px"
                  variant={forfeitWinner === pos ? 'solid' : 'outline'}
                  colorPalette={forfeitWinner === pos ? 'green' : 'gray'}
                  onClick={() => setForfeitWinner(pos)}
                >
                  {pos === 1 ? team1 : team2}
                </Button>
              ))}
            </Flex>
            <Text fontSize="xs" color="gray.500" mt={3}>
              {t('forfeitHint')}
            </Text>
          </>
        )}

        {mode === 'manual' && (
          <>
            <Flex gap={3}>
              {([1, 2] as const).map((pos) => (
                <Box key={pos} flex="1">
                  <Text fontSize="sm" color="gray.500" mb={1} truncate>
                    {pos === 1 ? team1 : team2}
                  </Text>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    value={pos === 1 ? manual1 : manual2}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      if (pos === 1) setManual1(v);
                      else setManual2(v);
                    }}
                    textAlign="center"
                    h="48px"
                    fontSize="lg"
                    fontWeight="semibold"
                  />
                </Box>
              ))}
            </Flex>
            <ResultBox tone={manualWinner ? 'success' : 'neutral'}>
              <Text>
                {t('winner')}:{' '}
                <Text as="span" fontWeight="bold" color="green.500">
                  {manualWinner === 1
                    ? team1
                    : manualWinner === 2
                      ? team2
                      : t('draw')}
                </Text>
              </Text>
            </ResultBox>
          </>
        )}
      </ModalBody>
      <ModalFooter p={{ base: 4, md: 5 }}>
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={submitting}
            leftIcon={<ArrowLeft size={16} />}
          >
            {t('back')}
          </Button>
        )}
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          {t('cancel')}
        </Button>
        <Button
          colorPalette="green"
          onClick={() => void handleSave()}
          loading={submitting}
          disabled={!canSave}
        >
          {t('save')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function TeamHeading({
  label,
  align,
}: {
  label: string;
  align: 'left' | 'right';
}) {
  return (
    <Box flex="1" minW={0}>
      <Text
        fontWeight="bold"
        fontSize={{ base: 'lg', md: 'xl' }}
        textAlign={align}
        lineClamp={2}
      >
        {label}
      </Text>
    </Box>
  );
}

function ResultBox({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'success' | 'warning' | 'neutral';
}) {
  const toneStyles = {
    success: {
      bg: 'green.50',
      color: 'green.700',
      borderColor: 'green.100',
      _dark: { bg: 'green.900', color: 'green.100', borderColor: 'green.700' },
    },
    warning: {
      bg: 'orange.50',
      color: 'orange.600',
      borderColor: 'orange.100',
      _dark: {
        bg: 'orange.900',
        color: 'orange.100',
        borderColor: 'orange.700',
      },
    },
    neutral: {
      bg: 'gray.50',
      color: 'gray.700',
      borderColor: 'gray.100',
      _dark: { bg: 'gray.700', color: 'gray.100', borderColor: 'gray.600' },
    },
  }[tone];

  return (
    <Box
      mt={4}
      p={3}
      borderWidth="1px"
      borderRadius="lg"
      textAlign="center"
      {...toneStyles}
    >
      {children}
    </Box>
  );
}
