'use client';

import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from '@/components/ui/ChakraModal';
import { TIER_COLORS, TIER_ICONS } from '@/components/leaderboard/TierBadge';
import { TRankingTier } from '@/lib/api/ranking.service';

/** Mirrors POINT_VALUES in vmito-be/src/points/points.constants.ts */
const SESSION_RULES: { reason: string; points: number }[] = [
  { reason: 'SESSION_MATCH_WIN', points: 10 },
  { reason: 'SESSION_MATCH_DRAW', points: 5 },
  { reason: 'SESSION_MATCH_LOSS', points: 2 },
  { reason: 'SESSION_PARTICIPATION', points: 5 },
];

/** Ranked on its own host board, never added to the player ranking. */
const HOST_RULE = { reason: 'SESSION_HOSTED', points: 15 };

const TOURNAMENT_RULES: { reason: string; points: number }[] = [
  { reason: 'TOURNAMENT_MATCH_WIN', points: 20 },
  { reason: 'TOURNAMENT_MATCH_DRAW', points: 10 },
  { reason: 'TOURNAMENT_MATCH_LOSS', points: 5 },
  { reason: 'TOURNAMENT_CHAMPION', points: 100 },
  { reason: 'TOURNAMENT_RUNNER_UP', points: 60 },
  { reason: 'TOURNAMENT_SEMIFINALIST', points: 30 },
];

/** Mirrors TIER_THRESHOLDS in vmito-be/src/points/points.constants.ts */
const TIERS: { tier: TRankingTier; minPoints: number }[] = [
  { tier: 'DIAMOND', minPoints: 10000 },
  { tier: 'PLATINUM', minPoints: 4000 },
  { tier: 'GOLD', minPoints: 1500 },
  { tier: 'SILVER', minPoints: 500 },
  { tier: 'BRONZE', minPoints: 0 },
];

const HOST_CONDITION_KEYS = ['finished', 'notCrawled', 'minPlayers'] as const;

interface PointsRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PointsRulesModal({
  isOpen,
  onClose,
}: PointsRulesModalProps) {
  const t = useTranslations('leaderboard.rules');
  const tReason = useTranslations('leaderboard.achievements.reasons');
  const tTier = useTranslations('leaderboard.tiers');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>{t('title')}</ModalHeader>
        <ModalCloseButton onClose={onClose} />
        <ModalBody>
          <VStack align="stretch" gap={5}>
            <Text fontSize="sm" color="fg.muted">
              {t('intro')}
            </Text>

            <RuleGroup title={t('sessionGroup')}>
              {SESSION_RULES.map((rule) => (
                <RuleRow
                  key={rule.reason}
                  label={tReason(rule.reason)}
                  points={rule.points}
                />
              ))}
            </RuleGroup>

            {/* <Box
              p={3}
              borderRadius="lg"
              bg="bg.muted"
              borderWidth="1px"
              borderColor="border.subtle"
            >
              <Text fontSize="sm" fontWeight="700" mb={2}>
                {t('hostTitle')}
              </Text>
              <RuleRow
                label={tReason(HOST_RULE.reason)}
                points={HOST_RULE.points}
              />
              <VStack align="stretch" gap={1.5} pt={2}>
                {HOST_CONDITION_KEYS.map((key) => (
                  <HStack key={key} align="flex-start" gap={2}>
                    <Text fontSize="xs" lineHeight="1.5" color="green.500">
                      ✓
                    </Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="1.5">
                      {t(`hostConditions.${key}`)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
              <Text fontSize="xs" color="fg.muted" pt={2} lineHeight="1.5">
                {t('hostSeparate')}
              </Text>
            </Box> */}

            <RuleGroup title={t('tournamentGroup')}>
              {TOURNAMENT_RULES.map((rule) => (
                <RuleRow
                  key={rule.reason}
                  label={tReason(rule.reason)}
                  points={rule.points}
                />
              ))}
            </RuleGroup>

            <RuleGroup title={t('tierGroup')}>
              {TIERS.map(({ tier, minPoints }) => (
                <Flex key={tier} justify="space-between" align="center" py={1}>
                  <HStack gap={2}>
                    <Text fontSize="sm">{TIER_ICONS[tier]}</Text>
                    <Badge
                      bg={TIER_COLORS[tier].bg}
                      color={TIER_COLORS[tier].color}
                      borderRadius="full"
                      px={2}
                      fontSize="xs"
                    >
                      {tTier(tier)}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">
                    {t('fromPoints', { points: minPoints })}
                  </Text>
                </Flex>
              ))}
            </RuleGroup>

            <Text fontSize="xs" color="fg.muted">
              {t('note')}
            </Text>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

const RuleGroup = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box>
    <Text fontSize="sm" fontWeight="700" mb={2}>
      {title}
    </Text>
    <VStack align="stretch" gap={0}>
      {children}
    </VStack>
  </Box>
);

const RuleRow = ({ label, points }: { label: string; points: number }) => (
  <Flex
    justify="space-between"
    align="center"
    py={1.5}
    borderBottomWidth="1px"
    borderColor="border.subtle"
    _last={{ borderBottomWidth: 0 }}
  >
    <Text fontSize="sm">{label}</Text>
    <Text fontSize="sm" fontWeight="800" color="brand.500" flexShrink={0}>
      +{points}
    </Text>
  </Flex>
);
