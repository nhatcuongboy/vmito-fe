'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Badge,
  Text,
  Image,
  Stack,
} from '@chakra-ui/react';
import { Button, HStack } from '@/components/ui/chakra-compat';
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
        await PlayerService.updatePlayerStatus(sessionId, playerId, status);
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
    [sessionId, onPlayerUpdate, t]
  );

  const handleBulkAction = useCallback(
    async (status: 'APPROVED' | 'REJECTED') => {
      try {
        setBulkActionLoading(status === 'APPROVED' ? 'approve' : 'reject');
        // Process each player sequentially
        for (const player of pendingPlayers) {
          try {
            await PlayerService.updatePlayerStatus(
              sessionId,
              player.id,
              status
            );
          } catch (error) {
            console.error(
              `Failed to ${status.toLowerCase()} player ${player.id}:`,
              error
            );
          }
        }
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
    [sessionId, pendingPlayers, onPlayerUpdate, t]
  );

  if (pendingPlayers.length === 0) {
    return null;
  }

  return (
    <Box
      borderLeft="4px solid"
      borderColor="purple.500"
      bg="purple.50"
      _dark={{ bg: 'rgba(168, 85, 247, 0.1)' }}
      borderRadius="md"
      p={4}
      mb={4}
    >
      {/* Section Header */}
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={2}
        mb={isExpanded ? 4 : 0}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          leftIcon={
            isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />
          }
          p={1}
          _hover={{ bg: 'purple.100', _dark: { bg: 'purple.900' } }}
        >
          <Heading
            size="sm"
            fontWeight="600"
            color="purple.700"
            _dark={{ color: 'purple.200' }}
          >
            {t('pendingRequestsCount', { count: pendingPlayers.length })}
          </Heading>
        </Button>

        {isExpanded && (
          <HStack gap={2} w={{ base: '100%', sm: 'auto' }}>
            <Button
              size="sm"
              colorPalette="green"
              variant="outline"
              leftIcon={<Check size={14} />}
              onClick={() => handleBulkAction('APPROVED')}
              loading={bulkActionLoading === 'approve'}
              disabled={bulkActionLoading !== null}
              fontSize="xs"
              flex={{ base: 1, sm: 'unset' }}
            >
              {t('approveAll')}
            </Button>
            <Button
              size="sm"
              colorPalette="red"
              variant="outline"
              leftIcon={<X size={14} />}
              onClick={() => handleBulkAction('REJECTED')}
              loading={bulkActionLoading === 'reject'}
              disabled={bulkActionLoading !== null}
              fontSize="xs"
              flex={{ base: 1, sm: 'unset' }}
            >
              {t('rejectAll')}
            </Button>
          </HStack>
        )}
      </Flex>

      {/* Vertical Stack for Pending Players */}
      {isExpanded && (
        <Stack gap={3}>
          {pendingPlayers.map((player) => (
            <Box
              key={player.id}
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderColor="purple.100"
              borderWidth="1px"
              shadow="sm"
              transition="all 0.2s"
              _hover={{
                shadow: 'md',
                borderColor: 'purple.300',
              }}
              borderRadius="xl"
              p={3}
            >
              <Flex
                direction={{ base: 'column', md: 'row' }}
                align={{ base: 'flex-start', md: 'center' }}
                gap={4}
                justify="space-between"
              >
                {/* User Info */}
                <Flex align="center" gap={3} flex={1}>
                  <Box
                    boxSize="48px"
                    borderRadius="full"
                    overflow="hidden"
                    bg="gray.100"
                    flexShrink={0}
                    borderWidth="2px"
                    borderColor="purple.100"
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
                        <User size={24} className="text-gray-400" />
                      </Flex>
                    )}
                  </Box>

                  <Box>
                    <HStack gap={2} mb={1}>
                      <Text
                        fontSize="md"
                        fontWeight="bold"
                        color="gray.800"
                        _dark={{ color: 'white' }}
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
                          size="sm"
                        >
                          {player.gender === 'MALE'
                            ? tCommon('male')
                            : player.gender === 'FEMALE'
                              ? tCommon('female')
                              : tCommon('other')}
                        </Badge>
                      )}
                    </HStack>
                    <HStack gap={2}>
                      <Badge colorPalette="purple" variant="subtle" size="sm">
                        {player.level
                          ? tCommon(`levelShorts.${player.level}`)
                          : '?'}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        #{player.playerNumber}
                      </Text>
                    </HStack>
                  </Box>
                </Flex>

                {/* Actions */}
                <HStack
                  gap={3}
                  w={{ base: '100%', md: 'auto' }}
                  pt={{ base: 2, md: 0 }}
                  borderTopWidth={{ base: '1px', md: '0px' }}
                  borderTopColor="gray.100"
                >
                  <Button
                    size="sm"
                    colorPalette="green"
                    variant="solid"
                    flex={1}
                    minW={{ md: '120px' }}
                    onClick={() => handleAction(player.id, 'APPROVED')}
                    loading={actionLoading === player.id}
                    disabled={
                      actionLoading !== null || bulkActionLoading !== null
                    }
                    leftIcon={<Check size={16} />}
                  >
                    {t('approve')}
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={() => handleAction(player.id, 'REJECTED')}
                    disabled={
                      actionLoading !== null || bulkActionLoading !== null
                    }
                    leftIcon={<X size={16} />}
                  >
                    {t('reject')}
                  </Button>
                </HStack>
              </Flex>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default React.memo(PendingPlayersSection);
