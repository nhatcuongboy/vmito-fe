'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { VModal } from '@/components/ui/VModal';
import { CategoryMatch } from '@/lib/api/types';
import { getTeamLabel } from '@/lib/tournament/teamLabel';

interface ResetMatchResultConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: CategoryMatch | null;
  onConfirm: () => void | Promise<void>;
  isResetting?: boolean;
}

export default function ResetMatchResultConfirmModal({
  isOpen,
  onClose,
  match,
  onConfirm,
  isResetting = false,
}: ResetMatchResultConfirmModalProps) {
  const t = useTranslations('pages.tournaments.manualScore');

  if (!match) return null;

  const matchup = `${getTeamLabel(match, 1)} vs ${getTeamLabel(match, 2)}`;

  return (
    <VModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('resetResultConfirmTitle')}
      size="sm"
      primaryActionText={t('resetResultConfirmButton')}
      primaryColorScheme="red"
      onPrimaryAction={onConfirm}
      isPrimaryLoading={isResetting}
      secondaryActionText={t('cancel')}
    >
      <Text fontSize="sm" color="fg" mb={3}>
        {t('resetResultConfirmText')}
      </Text>
      <Flex align="center" gap={2} fontWeight="semibold" mb={3}>
        <Box color="red.500" flexShrink={0}>
          <RotateCcw size={16} />
        </Box>
        <Text fontSize="sm">{matchup}</Text>
      </Flex>
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
          {t('resetResultWarning')}
        </Text>
      </Flex>
    </VModal>
  );
}
