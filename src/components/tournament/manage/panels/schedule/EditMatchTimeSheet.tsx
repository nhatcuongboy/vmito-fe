'use client';

import { useState, useEffect } from 'react';
import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { useTranslations } from 'next-intl';
import { CategoryMatch, TournamentCourt } from '@/lib/api/types';

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

interface EditMatchTimeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  courts: TournamentCourt[];
  onUpdate: (
    matchId: string,
    courtId: string | null,
    startTime: string | null,
    endTime: string | null
  ) => void;
}

export default function EditMatchTimeSheet({
  isOpen,
  onClose,
  match,
  courts,
  onUpdate,
}: EditMatchTimeSheetProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.manager'
  );

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [matchLength, setMatchLength] = useState(60);
  const [courtId, setCourtId] = useState('');

  useEffect(() => {
    if (!match) return;

    if (match.startTime) {
      const st = new Date(match.startTime);
      setDate(st.toISOString().split('T')[0]);
      setStartTime(
        `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`
      );
    } else {
      setDate('');
      setStartTime('');
    }

    if (match.endTime && match.startTime) {
      const diffMin = Math.round(
        (new Date(match.endTime).getTime() -
          new Date(match.startTime).getTime()) /
          60000
      );
      if (MATCH_LENGTHS.includes(diffMin)) setMatchLength(diffMin);
    }

    setCourtId(match.courtId ?? '');
  }, [match]);

  if (!isOpen || !match) return null;

  const handleUpdate = () => {
    if (!date || !startTime) {
      onUpdate(match.id, courtId || null, null, null);
    } else {
      const startDt = new Date(`${date}T${startTime}:00`);
      const endDt = new Date(startDt.getTime() + matchLength * 60000);
      onUpdate(
        match.id,
        courtId || null,
        startDt.toISOString(),
        endDt.toISOString()
      );
    }
    onClose();
  };

  const handleClearTimes = () => {
    onUpdate(match.id, null, null, null);
    setDate('');
    setStartTime('');
    setCourtId('');
    onClose();
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #CBD5E0',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    outline: 'none',
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
          {/* Header */}
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="semibold" fontSize="lg">
              {t('editMatchTitle', { number: match.matchNumber })}
            </Text>
            <Button variant="outline" size="sm" onClick={handleClearTimes}>
              {t('clearTimes')}
            </Button>
          </Flex>

          {/* Date */}
          <Box mb={3}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={selectStyle}
              placeholder={t('date')}
            />
          </Box>

          {/* Start Time + Match Length */}
          <Flex gap={2} mb={3}>
            <Box flex={1}>
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

          {/* Update button */}
          <Button
            w="full"
            bg="gray.800"
            color="white"
            size="lg"
            onClick={handleUpdate}
          >
            {t('update')}
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
