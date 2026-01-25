'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Badge,
  Text,
  useMediaQuery,
  Image,
} from '@chakra-ui/react';
import {
  Card,
  CardBody,
  Button,
  HStack,
  SimpleGrid,
} from '@/components/ui/chakra-compat';
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<
    'approve' | 'reject' | null
  >(null);
  const [isMobile] = useMediaQuery(['(max-width: 768px)']);

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
      <Flex justify="space-between" align="center" mb={isExpanded ? 4 : 0}>
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
          <HStack gap={2}>
            <Heading
              size="sm"
              fontWeight="600"
              color="purple.700"
              _dark={{ color: 'purple.200' }}
            >
              {t('pendingRequestsCount', { count: pendingPlayers.length })}
            </Heading>
            <Badge
              colorPalette="purple"
              variant="solid"
              borderRadius="full"
              fontSize="xs"
              px={2}
            >
              {pendingPlayers.length}
            </Badge>
          </HStack>
        </Button>

        {isExpanded && (
          <HStack gap={2}>
            <Button
              size="sm"
              colorPalette="green"
              variant="outline"
              leftIcon={<Check size={14} />}
              onClick={() => handleBulkAction('APPROVED')}
              loading={bulkActionLoading === 'approve'}
              disabled={bulkActionLoading !== null}
              fontSize="xs"
            >
              {isMobile ? t('approveAllShort') || 'Approve' : t('approveAll')}
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
            >
              {isMobile ? t('rejectAllShort') || 'Reject' : t('rejectAll')}
            </Button>
          </HStack>
        )}
      </Flex>

      {/* Responsive Grid for Pending Players */}
      {isExpanded && (
        <SimpleGrid spacing={4} minChildWidth="250px">
          {pendingPlayers.map((player) => (
            <Card
              key={player.id}
              bg="white"
              _dark={{ bg: 'gray.800' }}
              borderColor="purple.200"
              borderWidth="1px"
              shadow="sm"
              transition="all 0.2s"
              _hover={{
                shadow: 'md',
                borderColor: 'purple.400',
                transform: 'translateY(-2px)',
              }}
              borderRadius="lg"
              overflow="hidden"
            >
              <CardBody p={3}>
                <Flex align="center" gap={3} mb={3}>
                  <Box
                    boxSize="40px"
                    borderRadius="full"
                    overflow="hidden"
                    bg="gray.200"
                    flexShrink={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderColor="purple.200"
                    borderWidth="2px"
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
                      <User size={20} className="text-gray-500" color="gray" />
                    )}
                  </Box>
                  <Box flex="1" overflow="hidden">
                    <HStack gap={1} mb={0.5}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.800"
                        _dark={{ color: 'white' }}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        title={player.name}
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
                          variant="subtle"
                          fontSize="10px"
                          px={1}
                          textTransform="capitalize"
                        >
                          {player.gender === 'MALE'
                            ? 'M'
                            : player.gender === 'FEMALE'
                              ? 'F'
                              : 'O'}
                        </Badge>
                      )}
                    </HStack>
                    <HStack gap={2}>
                      <Badge
                        colorPalette="purple"
                        fontSize="10px"
                        variant="outline"
                      >
                        Lv {player.level || '?'}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        #{player.playerNumber}
                      </Text>
                    </HStack>
                  </Box>
                </Flex>

                <HStack gap={2} w="full">
                  <Button
                    size="sm"
                    colorPalette="green"
                    variant="solid"
                    flex={1}
                    h="32px"
                    fontSize="xs"
                    onClick={() => handleAction(player.id, 'APPROVED')}
                    loading={actionLoading === player.id}
                    disabled={
                      actionLoading !== null || bulkActionLoading !== null
                    }
                    leftIcon={<Check size={14} />}
                  >
                    {t('approve')}
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="ghost"
                    flex={1}
                    h="32px"
                    fontSize="xs"
                    onClick={() => handleAction(player.id, 'REJECTED')}
                    disabled={
                      actionLoading !== null || bulkActionLoading !== null
                    }
                    leftIcon={<X size={14} />}
                  >
                    {t('reject')}
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default React.memo(PendingPlayersSection);
