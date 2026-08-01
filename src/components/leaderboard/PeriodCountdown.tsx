'use client';

import { useEffect, useState } from 'react';
import { HStack, Text } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

interface PeriodCountdownProps {
  /** Exclusive end of the period, ISO string from the API. */
  endsAt: string | null;
  isCurrent: boolean;
}

export default function PeriodCountdown({
  endsAt,
  isCurrent,
}: PeriodCountdownProps) {
  const t = useTranslations('leaderboard.countdown');
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt || !isCurrent) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(new Date(endsAt).getTime() - Date.now());
    tick();
    const timer = setInterval(tick, MINUTE_MS);
    return () => clearInterval(timer);
  }, [endsAt, isCurrent]);

  if (!endsAt) return null;

  if (!isCurrent) {
    return (
      <Text fontSize="xs" color="fg.subtle">
        {t('closed')}
      </Text>
    );
  }

  if (remaining === null) return null;

  const left = Math.max(remaining, 0);
  const days = Math.floor(left / DAY_MS);
  const parts =
    days > 0
      ? [
          t('days', { count: days }),
          t('hours', { count: Math.floor((left % DAY_MS) / HOUR_MS) }),
        ]
      : [
          t('hours', { count: Math.floor(left / HOUR_MS) }),
          t('minutes', { count: Math.floor((left % HOUR_MS) / MINUTE_MS) }),
        ];

  return (
    <HStack gap={1} flexShrink={0}>
      <Text fontSize="xs" color="fg.muted">
        {t('endsIn')}
      </Text>
      <Text fontSize="xs" fontWeight="700">
        {parts.join(' ')}
      </Text>
    </HStack>
  );
}
