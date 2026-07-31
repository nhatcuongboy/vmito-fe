'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useTranslations } from 'next-intl';
import { useSocket, SessionEventType } from '@/contexts/SocketContext';
import TierBadge, {
  TIER_COLORS,
  TIER_ICONS,
} from '@/components/leaderboard/TierBadge';
import { TRankingTier } from '@/lib/api/ranking.service';

interface IPointsAwardedPayload {
  userId: string;
  sport: string;
  points: number;
  reasons: string[];
  totalPoints: number;
  tier: TRankingTier;
  previousTier: TRankingTier;
  tierChanged: boolean;
}

const TOAST_DURATION_MS = 4500;

const fireConfetti = () => {
  const defaults = { spread: 70, ticks: 120, zIndex: 10000 };
  confetti({ ...defaults, particleCount: 80, origin: { y: 0.6 } });
  setTimeout(
    () =>
      confetti({
        ...defaults,
        particleCount: 60,
        angle: 60,
        origin: { x: 0, y: 0.7 },
      }),
    200
  );
  setTimeout(
    () =>
      confetti({
        ...defaults,
        particleCount: 60,
        angle: 120,
        origin: { x: 1, y: 0.7 },
      }),
    350
  );
};

export default function PointsCelebration() {
  const t = useTranslations('leaderboard.celebration');
  const { socket } = useSocket();
  const [toast, setToast] = useState<IPointsAwardedPayload | null>(null);
  const [tierUp, setTierUp] = useState<IPointsAwardedPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handlePointsAwarded = (payload: IPointsAwardedPayload) => {
      if (!payload || typeof payload.points !== 'number') return;

      if (payload.points > 0) {
        setToast(payload);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
      }

      if (payload.tierChanged) {
        setTierUp(payload);
        fireConfetti();
      }
    };

    socket.on(SessionEventType.POINTS_AWARDED, handlePointsAwarded);
    return () => {
      socket.off(SessionEventType.POINTS_AWARDED, handlePointsAwarded);
    };
  }, [socket]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return (
    <>
      {/* Floating +N points toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
              position: 'fixed',
              top: 'calc(env(safe-area-inset-top) + 64px)',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          >
            <Flex
              align="center"
              gap={3}
              px={4}
              py={2.5}
              bg="bg.panel"
              borderRadius="full"
              boxShadow="lg"
              borderWidth="1px"
              borderColor={TIER_COLORS[toast.tier].solid}
            >
              <Text fontSize="xl">🎉</Text>
              <Box>
                <Text fontWeight="800" fontSize="md" color="green.600">
                  +{toast.points} {t('points')}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {t('total', { total: toast.totalPoints })}
                </Text>
              </Box>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier-up modal */}
      <AnimatePresence>
        {tierUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9998,
            }}
            onClick={() => setTierUp(null)}
          >
            <motion.div
              initial={{ scale: 0.7, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <VStack
                gap={3}
                p={8}
                bg="bg.panel"
                borderRadius="2xl"
                boxShadow="2xl"
                maxW="320px"
                textAlign="center"
              >
                <motion.div
                  animate={{
                    rotate: [0, -8, 8, -4, 4, 0],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <Text fontSize="6xl" lineHeight={1}>
                    {TIER_ICONS[tierUp.tier]}
                  </Text>
                </motion.div>
                <Text fontSize="xl" fontWeight="900">
                  {t('rankUpTitle')}
                </Text>
                <TierBadge tier={tierUp.tier} size="lg" />
                <Text fontSize="sm" color="fg.muted">
                  {t('rankUpMessage', { total: tierUp.totalPoints })}
                </Text>
                <Box
                  as="button"
                  px={6}
                  py={2}
                  bg="brand.500"
                  color="white"
                  borderRadius="full"
                  fontWeight="700"
                  fontSize="sm"
                  cursor="pointer"
                  onClick={() => setTierUp(null)}
                >
                  {t('awesome')}
                </Box>
              </VStack>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
