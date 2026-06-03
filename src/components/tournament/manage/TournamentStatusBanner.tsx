'use client';

import { useState } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { Play, Flag, Ban, RotateCcw, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tournament, TournamentStatus } from '@/lib/api/types';
import { TournamentService } from '@/lib/api/tournament.service';
import { VModal, useModal } from '@/components/ui/VModal';

interface TournamentStatusBannerProps {
  tournament: Tournament;
  onUpdate: (updated: Tournament) => void;
}

// Visual treatment per lifecycle status.
const STATUS_STYLE: Record<
  TournamentStatus,
  { bg: string; border: string; dot: string; title: string; subtitle: string }
> = {
  [TournamentStatus.PREPARING]: {
    bg: 'gray.50',
    border: 'gray.200',
    dot: 'gray.400',
    title: 'gray.700',
    subtitle: 'gray.500',
  },
  [TournamentStatus.IN_PROGRESS]: {
    bg: 'green.50',
    border: 'green.200',
    dot: 'green.500',
    title: 'green.800',
    subtitle: 'green.600',
  },
  [TournamentStatus.FINISHED]: {
    bg: 'blue.50',
    border: 'blue.200',
    dot: 'blue.500',
    title: 'blue.800',
    subtitle: 'blue.600',
  },
  [TournamentStatus.CANCELLED]: {
    bg: 'red.50',
    border: 'red.200',
    dot: 'red.500',
    title: 'red.800',
    subtitle: 'red.600',
  },
};

// A transition the host can trigger from the current status.
interface StatusAction {
  // i18n key segment used for both the button label and confirm modal copy.
  key: 'start' | 'finish' | 'cancel' | 'reopen' | 'restore';
  target: TournamentStatus;
  colorPalette: string;
  icon: LucideIcon;
}

const ACTIONS_BY_STATUS: Record<TournamentStatus, StatusAction[]> = {
  [TournamentStatus.PREPARING]: [
    {
      key: 'start',
      target: TournamentStatus.IN_PROGRESS,
      colorPalette: 'green',
      icon: Play,
    },
    {
      key: 'cancel',
      target: TournamentStatus.CANCELLED,
      colorPalette: 'red',
      icon: Ban,
    },
  ],
  [TournamentStatus.IN_PROGRESS]: [
    {
      key: 'finish',
      target: TournamentStatus.FINISHED,
      colorPalette: 'blue',
      icon: Flag,
    },
    {
      key: 'cancel',
      target: TournamentStatus.CANCELLED,
      colorPalette: 'red',
      icon: Ban,
    },
  ],
  [TournamentStatus.FINISHED]: [
    {
      key: 'reopen',
      target: TournamentStatus.IN_PROGRESS,
      colorPalette: 'gray',
      icon: RotateCcw,
    },
  ],
  [TournamentStatus.CANCELLED]: [
    {
      key: 'restore',
      target: TournamentStatus.PREPARING,
      colorPalette: 'gray',
      icon: RotateCcw,
    },
  ],
};

export default function TournamentStatusBanner({
  tournament,
  onUpdate,
}: TournamentStatusBannerProps) {
  const t = useTranslations('pages.tournaments.detail.manage.statusBanner');
  const confirmModal = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState<StatusAction | null>(null);

  const status = tournament.status;
  const style = STATUS_STYLE[status];
  const actions = ACTIONS_BY_STATUS[status];

  const openConfirm = (action: StatusAction) => {
    setPending(action);
    confirmModal.onOpen();
  };

  const handleConfirm = async () => {
    if (!pending) return;
    try {
      setIsLoading(true);
      const updated = await TournamentService.updateTournamentStatus(
        tournament.id,
        pending.target
      );
      onUpdate(updated);
      confirmModal.onClose();
      setPending(null);
    } catch (error) {
      console.error('Error updating tournament status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Box
        w="full"
        bg={style.bg}
        borderWidth="1px"
        borderColor={style.border}
        borderRadius="xl"
        px={4}
        py={3}
      >
        <Flex align="center" gap={2.5} mb={3}>
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={style.dot}
            flexShrink={0}
          />
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color={style.title}>
              {t(`statusTitle.${status}`)}
            </Text>
            <Text fontSize="xs" color={style.subtitle} mt={0.5}>
              {t(`statusSubtitle.${status}`)}
            </Text>
          </Box>
        </Flex>

        <Flex gap={2} wrap="wrap">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.key}
                size="sm"
                colorPalette={action.colorPalette}
                variant={action.colorPalette === 'gray' ? 'outline' : 'solid'}
                borderRadius="full"
                onClick={() => openConfirm(action)}
              >
                <Icon size={14} />
                {t(`actions.${action.key}`)}
              </Button>
            );
          })}
        </Flex>
      </Box>

      <VModal
        isOpen={confirmModal.isOpen}
        onClose={() => {
          confirmModal.onClose();
          setPending(null);
        }}
        isCentered
        size="sm"
        primaryActionText={pending ? t(`confirm.${pending.key}.button`) : ''}
        onPrimaryAction={handleConfirm}
        isPrimaryLoading={isLoading}
        secondaryActionText={t('cancelButton')}
        showCloseButton={false}
      >
        {pending && (
          <Flex direction="column" align="center" gap={4} py={2}>
            <Flex
              w="56px"
              h="56px"
              bg={`${pending.colorPalette}.100`}
              borderRadius="xl"
              align="center"
              justify="center"
            >
              {(() => {
                const PendingIcon = pending.icon;
                return (
                  <PendingIcon
                    size={28}
                    color={`var(--chakra-colors-${pending.colorPalette}-600)`}
                  />
                );
              })()}
            </Flex>
            <Box textAlign="center">
              <Text fontWeight="bold" fontSize="lg" mb={2}>
                {t(`confirm.${pending.key}.title`)}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {t(`confirm.${pending.key}.description`)}
              </Text>
            </Box>
          </Flex>
        )}
      </VModal>
    </>
  );
}
