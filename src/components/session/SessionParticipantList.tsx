'use client';

import { ISession, Player } from '@/lib/api/types';
import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  Separator,
  Text,
  VStack,
  Wrap,
} from '@chakra-ui/react';
import { Icon } from '@chakra-ui/react';
import { Trophy, User, UserCheck, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getSkillLevelColor } from '@/lib/utils/skillLevel.utils';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/chakra-compat';
import { VTooltip } from '@/components/ui/VTooltip';
import SessionAiAnalysisChip from './SessionAiAnalysisChip';
import { VModal } from '@/components/ui/VModal';
import { useRouter } from '@/i18n/config';

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
  const common = useTranslations('common');
  const router = useRouter();
  const { getLevelLabel, getLevelShortLabel } = useLevelLabel();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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
  const selectedPlayerName = selectedPlayer
    ? selectedPlayer.user?.name ||
      selectedPlayer.name ||
      `P${selectedPlayer.playerNumber}`
    : '';

  const getGenderLabel = (gender?: Player['gender']) => {
    if (gender === 'MALE') return common('male');
    if (gender === 'FEMALE') return common('female');
    if (gender === 'OTHER') return common('other');
    if (gender === 'PREFER_NOT_TO_SAY') return common('preferNotToSay');
    return common('unknown');
  };

  const handleViewProfile = () => {
    if (!selectedPlayer?.userId) return;
    router.push(`/user/${selectedPlayer.userId}`);
    setSelectedPlayer(null);
  };

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
                    <Box
                      as="button"
                      {...({ type: 'button' } as Record<string, unknown>)}
                      position="relative"
                      display="inline-block"
                      borderRadius="full"
                      cursor="pointer"
                      aria-label={t('viewPlayerDetails', {
                        name: displayName,
                      })}
                      onClick={() => setSelectedPlayer(player)}
                      _focusVisible={{
                        outline: '2px solid',
                        outlineColor: 'green.500',
                        outlineOffset: '3px',
                      }}
                      _hover={{ transform: 'translateY(-1px)' }}
                      transition="transform 0.15s ease"
                    >
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

      <VModal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        title={t('playerDetails')}
        size="sm"
        secondaryActionText={common('close')}
        primaryActionText={
          selectedPlayer?.userId ? t('viewPlayerProfile') : undefined
        }
        onPrimaryAction={handleViewProfile}
        hideSecondaryAction={false}
      >
        {selectedPlayer && (
          <VStack align="stretch" gap={4}>
            <VStack align="center" gap={3}>
              <Box position="relative">
                <Avatar.Root
                  boxSize="80px"
                  borderWidth="3px"
                  borderColor={selectedPlayer.userId ? 'green.400' : 'gray.300'}
                  bg="green.500"
                >
                  <Avatar.Fallback name={selectedPlayerName}>
                    {selectedPlayerName.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                  {selectedPlayer.user?.image && (
                    <Avatar.Image src={selectedPlayer.user.image} />
                  )}
                </Avatar.Root>
                <Badge
                  position="absolute"
                  bottom="-2"
                  left="50%"
                  transform="translateX(-50%)"
                  colorPalette={selectedPlayer.userId ? 'green' : 'gray'}
                  variant="solid"
                  borderRadius="full"
                  px={2}
                  whiteSpace="nowrap"
                >
                  <HStack gap={1}>
                    <Box
                      as={selectedPlayer.userId ? UserCheck : User}
                      boxSize={3}
                    />
                    <Text as="span" fontSize="2xs">
                      {selectedPlayer.userId ? t('member') : t('guest')}
                    </Text>
                  </HStack>
                </Badge>
              </Box>
              <Text fontSize="lg" fontWeight="bold" textAlign="center" mt={2}>
                {selectedPlayerName}
              </Text>
            </VStack>

            <Separator />

            <VStack align="stretch" gap={2}>
              <PlayerInfoRow
                label={common('gender')}
                value={getGenderLabel(selectedPlayer.gender)}
              />
              <PlayerInfoRow
                label={common('level')}
                value={
                  selectedPlayer.level
                    ? getLevelLabel(selectedPlayer.level)
                    : common('unknown')
                }
                valueNode={
                  selectedPlayer.level ? (
                    <Badge
                      colorPalette={
                        getSkillLevelColor([selectedPlayer.level]).colorPalette
                      }
                      variant="subtle"
                      borderRadius="full"
                    >
                      <HStack gap={1}>
                        <Box as={Trophy} boxSize={3} />
                        <Text as="span">
                          {getLevelLabel(selectedPlayer.level)}
                        </Text>
                      </HStack>
                    </Badge>
                  ) : undefined
                }
              />
              {selectedPlayer.levelDescription && (
                <PlayerInfoRow
                  label={t('levelDescription')}
                  value={selectedPlayer.levelDescription}
                />
              )}
              {selectedPlayer.club?.name && (
                <PlayerInfoRow
                  label={t('club')}
                  value={selectedPlayer.club.name}
                  valueNode={
                    <Badge variant="subtle" colorPalette="green">
                      {selectedPlayer.club.name}
                    </Badge>
                  }
                />
              )}
            </VStack>
          </VStack>
        )}
      </VModal>
    </Box>
  );
};

function PlayerInfoRow({
  label,
  value,
  valueNode,
}: {
  label: string;
  value: string;
  valueNode?: ReactNode;
}) {
  return (
    <Flex
      align="flex-start"
      justify="space-between"
      gap={4}
      bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
      borderRadius="md"
      px={3}
      py={2}
    >
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Box textAlign="right" maxW="65%">
        {valueNode ?? (
          <Text fontSize="sm" fontWeight="medium" color="fg">
            {value}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

export default SessionParticipantList;
