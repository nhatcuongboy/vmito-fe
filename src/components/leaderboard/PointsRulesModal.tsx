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
import {
  RANKING_TIERS,
  SESSION_POINT_RULES,
  TOURNAMENT_POINT_RULES,
} from '@/components/leaderboard/points-config';

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
              {SESSION_POINT_RULES.map((rule) => (
                <RuleRow
                  key={rule.reason}
                  label={tReason(rule.reason)}
                  points={rule.points}
                />
              ))}
            </RuleGroup>

            <RuleGroup title={t('tournamentGroup')}>
              {TOURNAMENT_POINT_RULES.map((rule) => (
                <RuleRow
                  key={rule.reason}
                  label={tReason(rule.reason)}
                  points={rule.points}
                />
              ))}
            </RuleGroup>

            <RuleGroup title={t('tierGroup')}>
              {RANKING_TIERS.map(({ tier, minPoints }) => (
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
