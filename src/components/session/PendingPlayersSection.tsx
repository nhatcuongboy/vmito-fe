'use client';

import React, { useState, useCallback } from 'react';
import { Box, Flex, Badge, Text, Stack } from '@chakra-ui/react';
import { Button, HStack, Image } from '@/components/ui/chakra-compat';
import { ChevronDown, ChevronUp, Check, X, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlayerService } from '@/lib/api/player.service';
import { Player } from '@/lib/api/types';
import { toaster } from '@/components/ui/toaster';

interface PendingPlayersSectionProps {
  sessionId: string;
  pendingPlayers: Player[];
  onPlayerUpdate: () => void;
}

const PendingPlayersSection: React.FC<PendingPlayersSectionProps> = ({
  sessionId,
  pendingPlayers,
  onPlayerUpdate,
}) => {
  const t = useTranslations('SessionDetail.playersTab');
  const tCommon = useTranslations('common');
  const [isExpanded, setIsExpanded] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<
    'approve' | 'reject' | null
  >(null);

  const handleAction = useCallback(
    async (playerId: string, status: 'APPROVED' | 'REJECTED') => {
      try {
        setActionLoading(playerId);
        const target = pendingPlayers.find((p) => p.id === playerId);
        // Approve/reject all slots of the same user in this session at once
        const groupId = target?.createdByUserId ?? target?.userId;
        const playerIds = groupId
          ? pendingPlayers
              .filter((p) => (p.createdByUserId ?? p.userId) === groupId)
              .map((p) => p.id)
          : [playerId];
        await PlayerService.batchUpdateStatus(playerIds, status);
        const message =
          status === 'APPROVED' ? t('playerApproved') : t('playerRejected');
        toaster.success({ title: message });
        onPlayerUpdate();
      } catch (error) {
        console.error('Failed to update player status:', error);
        toaster.error({ title: t('actionFailed') });
      } finally {
        setActionLoading(null);
      }
    },
    [pendingPlayers, onPlayerUpdate, t]
  );

  const handleBulkAction = useCallback(
    async (status: 'APPROVED' | 'REJECTED') => {
      try {
        setBulkActionLoading(status === 'APPROVED' ? 'approve' : 'reject');
        const playerIds = pendingPlayers.map((p) => p.id);
        await PlayerService.batchUpdateStatus(playerIds, status);
        const message =
          status === 'APPROVED'
            ? t('allPlayersApproved')
            : t('allPlayersRejected');
        toaster.success({ title: message });
        onPlayerUpdate();
      } catch (error) {
        console.error('Bulk action failed:', error);
        toaster.error({ title: t('actionFailed') });
      } finally {
        setBulkActionLoading(null);
      }
    },
    [pendingPlayers, onPlayerUpdate, t]
  );

  if (pendingPlayers.length === 0) {
    return null;
  }

  return (
    <Box
      borderLeft="3px solid"
      borderColor="purple.400"
      bg="purple.50"
      _dark={{ bg: 'rgba(168, 85, 247, 0.08)' }}
      borderRadius="lg"
      overflow="hidden"
      mb={4}
    >
      {/* Section Header */}
      <Box
        px={3}
        pt={2}
        pb={isExpanded ? 2 : 2}
        _hover={{ bg: 'purple.100', _dark: { bg: 'rgba(168, 85, 247, 0.15)' } }}
        transition="background 0.15s"
      >
        {/* Row 1: toggle + title */}
        <Flex
          align="center"
          gap={2}
          cursor="pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp size={15} className="text-purple-500" />
          ) : (
            <ChevronDown size={15} className="text-purple-500" />
          )}
          <Text
            fontSize="sm"
            fontWeight="600"
            color="purple.700"
            _dark={{ color: 'purple.300' }}
          >
            {t('pendingRequestsCount', { count: pendingPlayers.length })}
          </Text>
        </Flex>

        {/* Row 2: bulk action buttons */}
        {isExpanded && (
          <HStack gap={2} mt={2}>
            <Button
              size="xs"
              colorPalette="green"
              variant="outline"
              leftIcon={<Check size={12} />}
              onClick={() => handleBulkAction('APPROVED')}
              loading={bulkActionLoading === 'approve'}
              disabled={bulkActionLoading !== null}
            >
              {t('approveAll')}
            </Button>
            <Button
              size="xs"
              colorPalette="red"
              variant="outline"
              leftIcon={<X size={12} />}
              onClick={() => handleBulkAction('REJECTED')}
              loading={bulkActionLoading === 'reject'}
              disabled={bulkActionLoading !== null}
            >
              {t('rejectAll')}
            </Button>
          </HStack>
        )}
      </Box>

      {/* Player List */}
      {isExpanded && (
        <Stack gap={0} divideColor="purple.100">
          {pendingPlayers.map((player, idx) => (
            <Flex
              key={player.id}
              align="center"
              gap={3}
              px={3}
              py={2}
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderTopWidth={idx === 0 ? '1px' : '0'}
              borderBottomWidth="1px"
              borderColor="purple.100"
            >
              {/* Avatar */}
              <Box
                boxSize="36px"
                borderRadius="full"
                overflow="hidden"
                bg="gray.100"
                flexShrink={0}
                borderWidth="1.5px"
                borderColor="purple.200"
              >
                {player.user?.image ? (
                  <Image
                    src={player.user.image}
                    alt={player.name}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                ) : (
                  <Flex align="center" justify="center" h="100%">
                    <User size={18} className="text-gray-400" />
                  </Flex>
                )}
              </Box>

              {/* Info */}
              <Box flex={1} minW={0}>
                <Flex align="center" gap={1.5} flexWrap="wrap">
                  <Text
                    fontSize="sm"
                    fontWeight="600"
                    color="gray.800"
                    _dark={{ color: 'white' }}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {player.name || 'N/A'}
                  </Text>
                  {player.gender && (
                    <Badge
                      colorPalette={
                        player.gender === 'MALE'
                          ? 'blue'
                          : player.gender === 'FEMALE'
                            ? 'pink'
                            : 'gray'
                      }
                      variant="solid"
                      size="xs"
                    >
                      {player.gender === 'MALE'
                        ? tCommon('male')
                        : player.gender === 'FEMALE'
                          ? tCommon('female')
                          : tCommon('other')}
                    </Badge>
                  )}
                </Flex>
                <Flex align="center" gap={1.5} mt={0.5}>
                  <Badge colorPalette="purple" variant="subtle" size="xs">
                    {player.level
                      ? tCommon(`levelShorts.${player.level}`)
                      : '?'}
                  </Badge>
                  <Text fontSize="xs" color="gray.400">
                    #{player.playerNumber}
                  </Text>
                </Flex>
              </Box>

              {/* Actions */}
              <HStack gap={1.5} flexShrink={0}>
                <Button
                  size="xs"
                  colorPalette="green"
                  variant="solid"
                  onClick={() => handleAction(player.id, 'APPROVED')}
                  loading={actionLoading === player.id}
                  disabled={
                    actionLoading !== null || bulkActionLoading !== null
                  }
                  leftIcon={<Check size={13} />}
                >
                  {t('approve')}
                </Button>
                <Button
                  size="xs"
                  colorPalette="red"
                  variant="outline"
                  onClick={() => handleAction(player.id, 'REJECTED')}
                  disabled={
                    actionLoading !== null || bulkActionLoading !== null
                  }
                  leftIcon={<X size={13} />}
                >
                  {t('reject')}
                </Button>
              </HStack>
            </Flex>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default React.memo(PendingPlayersSection);
