'use client';

import { useState } from 'react';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  PauseCircle,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/chakra-compat';
import AppConfirmDialog from '@/components/ui/AppConfirmDialog';
import { ClubsService } from '@/lib/api/clubs.service';
import { EClubOperationalStatus, IClub } from '@/types/club';
import { toaster } from '@/components/ui/toaster';
import { UserRole } from '@/lib/api/types';

interface ClubOperationalStatusPanelProps {
  club: IClub;
  userRole: UserRole;
  onStatusUpdated?: (updatedClub: IClub) => void;
}

const STATUS_CONFIG: Record<
  EClubOperationalStatus,
  {
    labelKey: 'active' | 'inactive' | 'dissolved';
    badgeColorPalette: string;
    icon: React.ElementType;
  }
> = {
  [EClubOperationalStatus.ACTIVE]: {
    labelKey: 'active',
    badgeColorPalette: 'green',
    icon: CheckCircle2,
  },
  [EClubOperationalStatus.INACTIVE]: {
    labelKey: 'inactive',
    badgeColorPalette: 'orange',
    icon: PauseCircle,
  },
  [EClubOperationalStatus.DISSOLVED]: {
    labelKey: 'dissolved',
    badgeColorPalette: 'red',
    icon: Trash2,
  },
};

export function ClubOperationalStatusPanel({
  club,
  userRole,
  onStatusUpdated,
}: ClubOperationalStatusPanelProps) {
  const t = useTranslations('clubs.operationalStatus');
  const [isLoading, setIsLoading] = useState(false);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] =
    useState<EClubOperationalStatus | null>(null);

  const currentStatus = club.operationalStatus ?? EClubOperationalStatus.ACTIVE;
  const isAdmin = userRole === UserRole.ADMIN;
  const isDissolved = currentStatus === EClubOperationalStatus.DISSOLVED;
  const config = STATUS_CONFIG[currentStatus];
  const StatusIcon = config.icon;

  const handleUpdateStatus = async (newStatus: EClubOperationalStatus) => {
    try {
      setIsLoading(true);
      const updated = await ClubsService.updateOperationalStatus(
        club.id,
        newStatus
      );
      toaster.success({
        title: t('updated', {
          status: t(STATUS_CONFIG[newStatus].labelKey),
        }),
      });
      onStatusUpdated?.(updated);
    } catch (err) {
      console.error('Failed to update operational status:', err);
      toaster.error({ title: t('updateFailed') });
    } finally {
      setIsLoading(false);
      setShowDissolveConfirm(false);
    }
  };

  return (
    <Box
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
      bg={{ base: 'gray.50', _dark: 'gray.800/50' }}
    >
      <VStack align="stretch" gap={3}>
        <Flex
          align={{ base: 'flex-start', sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          gap={3}
        >
          <HStack gap={2}>
            <Activity size={16} />
            <Text fontWeight="semibold" fontSize="sm">
              {t('title')}
            </Text>
            <Badge colorPalette={config.badgeColorPalette} size="sm">
              <HStack gap={1}>
                <StatusIcon size={12} aria-hidden="true" />
                <Text>{t(config.labelKey)}</Text>
              </HStack>
            </Badge>
          </HStack>

          {!isDissolved && (
            <HStack gap={2} w={{ base: 'full', sm: 'auto' }}>
              {currentStatus === EClubOperationalStatus.ACTIVE ? (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="orange"
                  loading={isLoading}
                  flex={{ base: 1, sm: 'initial' }}
                  onClick={() =>
                    setPendingStatus(EClubOperationalStatus.INACTIVE)
                  }
                >
                  <PauseCircle size={14} />
                  {t('pause')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="green"
                  loading={isLoading}
                  flex={{ base: 1, sm: 'initial' }}
                  onClick={() =>
                    setPendingStatus(EClubOperationalStatus.ACTIVE)
                  }
                >
                  <CheckCircle2 size={14} />
                  {t('reactivate')}
                </Button>
              )}

              {isAdmin && !showDissolveConfirm && (
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => setShowDissolveConfirm(true)}
                >
                  <Trash2 size={14} />
                  {t('dissolve')}
                </Button>
              )}
            </HStack>
          )}
        </Flex>

        {isAdmin && showDissolveConfirm && (
          <Flex
            align={{ base: 'flex-start', sm: 'center' }}
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            gap={3}
            borderTopWidth="1px"
            borderColor="red.200"
            pt={3}
          >
            <HStack align="start" gap={2}>
              <AlertTriangle size={16} color="var(--chakra-colors-red-500)" />
              <Text fontSize="xs" color="red.600" _dark={{ color: 'red.300' }}>
                {t('dissolveWarning')}
              </Text>
            </HStack>
            <HStack gap={2}>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setShowDissolveConfirm(false)}
                disabled={isLoading}
              >
                {t('cancel')}
              </Button>
              <Button
                size="xs"
                colorPalette="red"
                loading={isLoading}
                onClick={() =>
                  handleUpdateStatus(EClubOperationalStatus.DISSOLVED)
                }
              >
                {t('confirmDissolve')}
              </Button>
            </HStack>
          </Flex>
        )}

        {isDissolved && (
          <HStack gap={2} color="red.600" _dark={{ color: 'red.300' }}>
            <AlertTriangle size={14} color="var(--chakra-colors-red-500)" />
            <Text fontSize="xs">{t('dissolvedMessage')}</Text>
          </HStack>
        )}
      </VStack>

      <AppConfirmDialog
        isOpen={pendingStatus !== null}
        title={t('confirmStatusTitle')}
        body={
          pendingStatus === EClubOperationalStatus.INACTIVE
            ? t('confirmPauseDescription')
            : t('confirmReactivateDescription')
        }
        confirmLabel={
          pendingStatus === EClubOperationalStatus.INACTIVE
            ? t('pause')
            : t('reactivate')
        }
        cancelLabel={t('cancel')}
        colorPalette={
          pendingStatus === EClubOperationalStatus.INACTIVE ? 'red' : 'green'
        }
        isLoading={isLoading}
        onConfirm={() => {
          if (pendingStatus) handleUpdateStatus(pendingStatus);
        }}
        onClose={() => setPendingStatus(null)}
      />
    </Box>
  );
}
