'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { CategoryMatch, MatchStatus } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

interface DeleteMatchConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
}

export default function DeleteMatchConfirmModal({
  isOpen,
  onClose,
  match,
  onConfirm,
  isDeleting = false,
}: DeleteMatchConfirmModalProps) {
  const t = useTranslations(
    'pages.tournaments.detail.manage.organize.schedule.manager'
  );

  if (!match) return null;

  // A match worth warning about: already running or with a recorded result.
  const hasResultOrLive =
    match.status === MatchStatus.IN_PROGRESS ||
    match.status === MatchStatus.FINISHED ||
    !!match.score ||
    !!match.winnerId;

  const matchup = `${getTeamLabel(match, 1)} vs ${getTeamLabel(match, 2)}`;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('deleteConfirmTitle')}
      size="sm"
      primaryActionText={t('deleteConfirmBtn')}
      primaryColorScheme="red"
      onPrimaryAction={onConfirm}
      isPrimaryLoading={isDeleting}
      secondaryActionText={t('cancel')}
    >
      <Text fontSize="sm" color="fg" mb={3}>
        {t('deleteConfirmText')}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg"
        mb={hasResultOrLive ? 3 : 0}
      >
        {matchup}
      </Text>
      {hasResultOrLive && (
        <Flex
          gap={2}
          align="flex-start"
          p={3}
          borderRadius="md"
          bg={{ base: 'red.50', _dark: 'red.900/30' }}
          borderWidth="1px"
          borderColor={{ base: 'red.200', _dark: 'red.700' }}
        >
          <Box color="red.500" mt="2px" flexShrink={0}>
            <AlertTriangle size={18} />
          </Box>
          <Text fontSize="sm" color={{ base: 'red.700', _dark: 'red.200' }}>
            {t('deleteWarningResult')}
          </Text>
        </Flex>
      )}
    </VModal>
  );
}
