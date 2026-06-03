'use client';

import { useState, useEffect, useMemo } from 'react';
import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import {
  Category,
  CategoryMatch,
  CategoryGroup,
  CategoryRegistration,
  TournamentCourt,
} from '@/lib/api/types';
import { CategoryService } from '@/lib/api/category.service';
import { toaster } from '@/components/ui/toaster';
import { getRegistrationLabel } from '@/lib/tournament/teamLabel';
import { generateNextMatchCode } from '@/lib/tournament/codes';

const MATCH_LENGTHS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 105, 120,
];

// 15-min time slots from 05:00 to 23:45
const TIME_SLOTS: string[] = [];
for (let h = 5; h <= 23; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    );
  }
}

const ROUNDS = ['GROUP', 'QF', 'SF', 'F', '3RD'] as const;

interface AddMatchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  courts: TournamentCourt[];
  /** Existing matches — used to compute the next match number per category. */
  allMatches: CategoryMatch[];
  /** Called with the freshly created (and optionally scheduled) match. */
  onCreated: (match: CategoryMatch) => void;
}

export default function AddMatchSheet({
  isOpen,
  onClose,
  categories,
  courts,
  allMatches,
  onCreated,
}: AddMatchSheetProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.manager'
  );
  const tList = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.list'
  );

  const [categoryId, setCategoryId] = useState('');
  const [round, setRound] = useState<string>('GROUP');
  const [matchCode, setMatchCode] = useState('');
  const [groupId, setGroupId] = useState('');
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [matchLength, setMatchLength] = useState(60);
  const [courtId, setCourtId] = useState('');

  const [registrations, setRegistrations] = useState<CategoryRegistration[]>(
    []
  );
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset everything whenever the sheet is (re)opened.
  useEffect(() => {
    if (!isOpen) return;
    setCategoryId('');
    setRound('GROUP');
    setMatchCode(generateNextMatchCode(allMatches));
    setGroupId('');
    setTeam1('');
    setTeam2('');
    setDate('');
    setStartTime('');
    setMatchLength(60);
    setCourtId('');
    setRegistrations([]);
    setGroups([]);
  }, [allMatches, isOpen]);

  // Load registrations + groups when the category changes.
  useEffect(() => {
    if (!categoryId) {
      setRegistrations([]);
      setGroups([]);
      return;
    }
    let cancelled = false;
    setIsLoadingTeams(true);
    setTeam1('');
    setTeam2('');
    setGroupId('');
    Promise.all([
      CategoryService.getRegistrations(categoryId),
      CategoryService.getGroups(categoryId),
    ])
      .then(([regs, grps]) => {
        if (cancelled) return;
        setRegistrations(regs);
        setGroups(grps);
      })
      .catch(() => {
        if (!cancelled) toaster.error({ title: t('loadFailed') });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTeams(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, t]);

  const teamOptions = useMemo(
    () =>
      registrations.map((reg) => ({
        value: reg.id,
        label: getRegistrationLabel(reg),
      })),
    [registrations]
  );

  const getRoundLabel = (r: string): string => {
    const map: Record<string, string> = {
      GROUP: tList('roundGroup'),
      QF: tList('roundQF'),
      SF: tList('roundSF'),
      F: tList('roundF'),
      '3RD': tList('round3rd'),
    };
    return map[r] || r;
  };

  if (!isOpen) return null;

  const showGroupSelect = round === 'GROUP' && groups.length > 0;
  const sameTeam = !!team1 && team1 === team2;
  const canSubmit = !!categoryId && !sameTeam && !isSubmitting;

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #CBD5E0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    outline: 'none',
  };

  const handleSubmit = async () => {
    if (!categoryId || sameTeam) return;

    setIsSubmitting(true);
    try {
      // Next match number within the chosen category.
      const existing = allMatches.filter((m) => m.categoryId === categoryId);
      const matchNumber =
        existing.reduce((max, m) => Math.max(max, m.matchNumber), 0) + 1;

      const participants: Array<{
        categoryRegistrationId: string;
        position: number;
      }> = [];
      if (team1)
        participants.push({ categoryRegistrationId: team1, position: 1 });
      if (team2)
        participants.push({ categoryRegistrationId: team2, position: 2 });

      const category = categories.find((c) => c.id === categoryId);

      let created = await CategoryService.createMatch(categoryId, {
        round,
        matchNumber,
        matchCode: matchCode.trim() || generateNextMatchCode(allMatches),
        groupId: showGroupSelect && groupId ? groupId : undefined,
        matchFormat: category?.matchFormat,
        participants,
      });

      // Persist schedule (court/time) through the same path the rest of the
      // schedule manager uses, so estimatedEndTime is set consistently.
      if (date && startTime) {
        const startDt = new Date(`${date}T${startTime}:00`);
        const endDt = new Date(startDt.getTime() + matchLength * 60000);
        await CategoryService.bulkUpdateSchedule([
          {
            matchId: created.id,
            courtId: courtId || null,
            startTime: startDt.toISOString(),
            endTime: endDt.toISOString(),
          },
        ]);
        created = {
          ...created,
          courtId: courtId || undefined,
          startTime: startDt,
          endTime: endDt,
          estimatedEndTime: endDt,
        };
      } else if (courtId) {
        created = { ...created, courtId };
      }

      onCreated(created);
      toaster.success({ title: t('createSuccess') });
      onClose();
    } catch (error) {
      console.error('Error creating match:', error);
      toaster.error({ title: t('createFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.500"
        zIndex={1500}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <Box
        position="fixed"
        left="50%"
        bottom={0}
        transform="translateX(-50%)"
        maxW="560px"
        w="full"
        maxH="90vh"
        overflowY="auto"
        bg="white"
        borderTopRadius="2xl"
        boxShadow="lg"
        zIndex={1501}
        pb={8}
        onClick={(e) => e.stopPropagation()}
        animation="slideUp 0.2s ease-out"
        css={{
          '@keyframes slideUp': {
            from: { transform: 'translateX(-50%) translateY(100%)' },
            to: { transform: 'translateX(-50%) translateY(0)' },
          },
        }}
      >
        {/* Drag handle */}
        <Flex justify="center" pt={3} pb={1}>
          <Box w="40px" h="4px" bg="gray.300" borderRadius="full" />
        </Flex>

        <Box px={4} pt={2} pb={4}>
          <Text fontWeight="semibold" fontSize="lg" mb={5}>
            {t('addMatchTitle')}
          </Text>

          {/* Match code */}
          <Box mb={3}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('matchCode')}
            </Text>
            <input
              value={matchCode}
              onChange={(e) => setMatchCode(e.target.value)}
              style={selectStyle}
              placeholder={t('matchCodePlaceholder')}
            />
          </Box>

          {/* Category */}
          <Box mb={3}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('category')}
            </Text>
            <select
              style={selectStyle}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t('category')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Box>

          {/* Round + Group */}
          <Flex gap={2} mb={3}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('round')}
              </Text>
              <select
                style={selectStyle}
                value={round}
                onChange={(e) => setRound(e.target.value)}
              >
                {ROUNDS.map((r) => (
                  <option key={r} value={r}>
                    {getRoundLabel(r)}
                  </option>
                ))}
              </select>
            </Box>
            {showGroupSelect && (
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {t('group')}
                </Text>
                <select
                  style={selectStyle}
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">{t('group')}</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name || `${t('group')} ${g.groupNumber}`}
                    </option>
                  ))}
                </select>
              </Box>
            )}
          </Flex>

          {/* Team 1 + Team 2 */}
          <Flex gap={2} mb={1}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('team1')}
              </Text>
              <select
                style={selectStyle}
                value={team1}
                disabled={!categoryId || isLoadingTeams}
                onChange={(e) => setTeam1(e.target.value)}
              >
                <option value="">{t('teamTBD')}</option>
                {teamOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('team2')}
              </Text>
              <select
                style={selectStyle}
                value={team2}
                disabled={!categoryId || isLoadingTeams}
                onChange={(e) => setTeam2(e.target.value)}
              >
                <option value="">{t('teamTBD')}</option>
                {teamOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Box>
          </Flex>
          {sameTeam && (
            <Text fontSize="xs" color="red.500" mb={2}>
              {t('sameTeamError')}
            </Text>
          )}

          {/* Date */}
          <Box mb={3} mt={3}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('date')}
            </Text>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={selectStyle}
            />
          </Box>

          {/* Start time + Match length */}
          <Flex gap={2} mb={3}>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('startTime')}
              </Text>
              <select
                style={selectStyle}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                <option value="">{t('startTime')}</option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </Box>
            <Box flex={1}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                {t('matchLength')}
              </Text>
              <select
                style={selectStyle}
                value={matchLength}
                onChange={(e) => setMatchLength(Number(e.target.value))}
              >
                {MATCH_LENGTHS.map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </Box>
          </Flex>

          {/* Court */}
          <Box mb={5}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              {t('court')}
            </Text>
            <select
              style={selectStyle}
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
            >
              <option value="">{t('court')}</option>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courtName || `${t('courtPrefix')} ${c.courtNumber}`}
                </option>
              ))}
            </select>
          </Box>

          {/* Submit */}
          <Button
            w="full"
            bg="gray.800"
            color="white"
            size="lg"
            disabled={!canSubmit}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {t('addMatch')}
          </Button>

          {/* Cancel */}
          <Flex justify="center" mt={3}>
            <Button variant="ghost" onClick={onClose}>
              {t('cancel')}
            </Button>
          </Flex>
        </Box>
      </Box>
    </Portal>
  );
}
