'use client';

import { ISession, Player } from '@/lib/api/types';
import { Avatar, Badge, Box, Flex, Text, Wrap } from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useState } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { VTooltip } from '@/components/ui/VTooltip';
import SessionAiAnalysisChip from './SessionAiAnalysisChip';

interface ISessionParticipantListProps {
  players?: Player[];
  approvedPlayersCount: number;
  maxPlayers: number;
  session?: ISession;
}

const MAX_VISIBLE_AVATARS = 12;

const SessionParticipantList = ({
  players,
  approvedPlayersCount,
  maxPlayers,
  session,
}: ISessionParticipantListProps) => {
  const t = useTranslations('session');
  const { getLevelShortLabel } = useLevelLabel();
  const [isExpanded, setIsExpanded] = useState(false);

  const approvedPlayers =
    players?.filter((p) => p.registrationStatus === 'APPROVED') || [];

  const hasPlayerData = approvedPlayers.length > 0;
  const hasMore = approvedPlayers.length > MAX_VISIBLE_AVATARS;
  const visiblePlayers = isExpanded
    ? approvedPlayers
    : approvedPlayers.slice(0, MAX_VISIBLE_AVATARS);
  const availableSlots = Math.max(0, maxPlayers - approvedPlayersCount);
  const visibleEmptySlots = isExpanded
    ? availableSlots
    : Math.min(
        availableSlots,
        Math.max(0, MAX_VISIBLE_AVATARS - visiblePlayers.length)
      );

  return (
    <Box>
      {/* Section Header */}
      <Flex align="center" justify="space-between" mb={3}>
        <Flex align="center" gap={2} flexWrap="wrap">
          <Flex align="center" gap={2}>
            <Icon as={Users} boxSize={5} color="green.500" />
            <Text fontWeight="semibold" fontSize="md">
              {t('whoWillPlay')}
            </Text>
          </Flex>
          {session && <SessionAiAnalysisChip session={session} />}
        </Flex>
        <Text fontSize="sm" color="gray.500">
          {approvedPlayersCount}/{maxPlayers}
        </Text>
      </Flex>

      {/* Avatar Grid */}
      {hasPlayerData ? (
        <>
          <Wrap gap={2}>
            {visiblePlayers.map((player) => {
              const levelColor = player.level
                ? getSkillLevelColor([player.level])
                : null;
              const displayName =
                player.user?.name || player.name || `P${player.playerNumber}`;

              return (
                <VTooltip
                  key={player.id}
                  content={displayName}
                  showArrow
                  openDelay={200}
                >
                  <Flex direction="column" align="center" gap={1} minW="56px">
                    <Box position="relative" display="inline-block">
                      <Box
                        borderRadius="full"
                        borderWidth="2px"
                        borderColor={levelColor?.color || 'gray.300'}
                        p="1px"
                      >
                        <Avatar.Root size="sm" bg="green.500">
                          <Avatar.Fallback name={displayName}>
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar.Fallback>
                          {player.user?.image && (
                            <Avatar.Image src={player.user.image} />
                          )}
                        </Avatar.Root>
                      </Box>
                      {player.level && (
                        <Badge
                          position="absolute"
                          top="-4px"
                          right="-6px"
                          colorPalette={levelColor?.colorPalette || 'gray'}
                          variant="solid"
                          fontSize="2xs"
                          fontWeight="bold"
                          px={1}
                          py={0}
                          lineHeight="1.4"
                          borderRadius="full"
                          borderWidth="1px"
                          borderColor={levelColor?.borderColor || 'gray.200'}
                          boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                          zIndex={1}
                          whiteSpace="nowrap"
                        >
                          {getLevelShortLabel(player.level)}
                        </Badge>
                      )}
                    </Box>
                    <Text
                      fontSize="2xs"
                      color="gray.600"
                      _dark={{ color: 'gray.400' }}
                      textAlign="center"
                      lineClamp={1}
                      maxW="60px"
                    >
                      {displayName}
                    </Text>
                  </Flex>
                </VTooltip>
              );
            })}
            {Array.from({ length: visibleEmptySlots }).map((_, index) => (
              <Flex
                key={`empty-slot-${index}`}
                direction="column"
                align="center"
                gap={1}
                minW="56px"
              >
                <Flex
                  align="center"
                  justify="center"
                  w="38px"
                  h="38px"
                  borderRadius="full"
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor="gray.300"
                  bg="gray.50"
                  _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                  color="gray.400"
                  fontSize="lg"
                  fontWeight="medium"
                >
                  +
                </Flex>
                <Text
                  fontSize="2xs"
                  color="gray.500"
                  _dark={{ color: 'gray.400' }}
                  textAlign="center"
                  lineClamp={1}
                  maxW="60px"
                >
                  {t('emptySlot')}
                </Text>
              </Flex>
            ))}
          </Wrap>

          {/* View all / Show less buttons */}
          {!isExpanded && hasMore && (
            <Button
              variant="ghost"
              size="xs"
              colorPalette="green"
              mt={2}
              onClick={() => setIsExpanded(true)}
            >
              {t('viewAll')}
            </Button>
          )}
          {isExpanded && hasMore && (
            <Button
              variant="ghost"
              size="xs"
              colorPalette="gray"
              mt={2}
              onClick={() => setIsExpanded(false)}
            >
              {t('showLess')}
            </Button>
          )}
        </>
      ) : (
        /* No player data - show count only */
        <Flex
          align="center"
          justify="center"
          py={4}
          bg="gray.50"
          _dark={{ bg: 'gray.700' }}
          borderRadius="lg"
        >
          <Text fontSize="sm" color="gray.500">
            {approvedPlayersCount > 0
              ? t('playerCount', { count: approvedPlayersCount })
              : t('noPlayersFound')}
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default SessionParticipantList;
