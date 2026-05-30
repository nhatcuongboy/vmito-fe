'use client';

import { Button as CompatButton } from '@/components/ui/chakra-compat';
import { VModal } from '@/components/ui/VModal';
import {
  MatchRepeatWarningItem,
  MatchRepeatWarningResult,
} from '@/utils/match-repeat-warning';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface MatchRepeatWarningButtonProps {
  warning?: MatchRepeatWarningResult | null;
}

const formatPlayer = (player: MatchRepeatWarningItem['players'][number]) =>
  player.name?.trim() || `#${player.playerNumber ?? '?'}`;

function WarningList({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: MatchRepeatWarningItem[];
}) {
  const t = useTranslations('SessionDetail');

  return (
    <Box>
      <Text fontSize="sm" fontWeight="bold" color="fg" mb={2}>
        {title}
      </Text>
      {items.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyText}
        </Text>
      ) : (
        <VStack align="stretch" gap={2}>
          {items.map((item) => (
            <Flex
              key={item.key}
              justify="space-between"
              align="center"
              gap={3}
              px={3}
              py={2}
              borderWidth="1px"
              borderColor={{ base: 'orange.100', _dark: 'orange.700' }}
              bg={{ base: 'orange.50', _dark: 'orange.900/20' }}
              borderRadius="md"
            >
              <Text fontSize="sm" fontWeight="medium" color="fg" minW={0}>
                {formatPlayer(item.players[0])} -{' '}
                {formatPlayer(item.players[1])}
              </Text>
              <Badge colorPalette="orange" variant="solid" flexShrink={0}>
                {t('courtsTab.matchRepeatWarning.matchCount', {
                  count: item.totalCount,
                })}
              </Badge>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
}

export default function MatchRepeatWarningButton({
  warning,
}: MatchRepeatWarningButtonProps) {
  const t = useTranslations('SessionDetail');
  const [isOpen, setIsOpen] = useState(false);

  if (!warning?.hasWarning) return null;

  return (
    <>
      <Box
        as="button"
        {...({ type: 'button' } as Record<string, unknown>)}
        aria-label={t('courtsTab.matchRepeatWarning.openDetails')}
        position="absolute"
        top="4%"
        left="2%"
        zIndex={8}
        cursor="pointer"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(true);
        }}
        bg="orange.400"
        color="white"
        borderRadius="full"
        w="28px"
        h="28px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 4px 12px rgba(234, 88, 12, 0.45), 0 2px 4px rgba(0, 0, 0, 0.2)"
        border="1px solid"
        borderColor="whiteAlpha.500"
        transition="all 0.2s ease"
        _hover={{
          bg: 'orange.500',
          transform: 'scale(1.12)',
          boxShadow: '0 6px 18px rgba(234, 88, 12, 0.55)',
        }}
      >
        <TriangleAlert size={16} />
      </Box>

      <VModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <HStack gap={2}>
            <Box as={TriangleAlert} boxSize={5} color="orange.500" />
            <Text>{t('courtsTab.matchRepeatWarning.title')}</Text>
          </HStack>
        }
        description={t('courtsTab.matchRepeatWarning.description')}
        size="md"
        footer={
          <CompatButton onClick={() => setIsOpen(false)}>
            {t('courtsTab.matchRepeatWarning.close')}
          </CompatButton>
        }
      >
        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" color="fg.muted">
            {t('courtsTab.matchRepeatWarning.hostNote')}
          </Text>
          <WarningList
            title={t('courtsTab.matchRepeatWarning.teammatesTitle')}
            emptyText={t('courtsTab.matchRepeatWarning.noTeammates')}
            items={warning.repeatedTeammates}
          />
          <WarningList
            title={t('courtsTab.matchRepeatWarning.opponentsTitle')}
            emptyText={t('courtsTab.matchRepeatWarning.noOpponents')}
            items={warning.repeatedOpponents}
          />
        </VStack>
      </VModal>
    </>
  );
}
