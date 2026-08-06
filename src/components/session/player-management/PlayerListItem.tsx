import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { Card, CardBody, HStack, VStack } from '@/components/ui/chakra-compat';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { AlertCircle, UserCheck, Zap, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { PlayerActionMenu } from './PlayerActionMenu';
import { Player } from './types';
import { Gender } from '@/lib/api/types';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PLAYING':
      return 'green.500';
    case 'WAITING':
      return 'orange.500';
    case 'READY':
      return 'brand.500';
    default:
      return 'gray.400';
  }
}

import { PlayerAvatar } from '@/components/player/PlayerAvatar';

function getStatusGradient(status: string) {
  switch (status) {
    case 'PLAYING':
      return 'linear(to-r, green.400, green.600)';
    case 'WAITING':
      return 'linear(to-r, orange.400, orange.600)';
    case 'READY':
      return 'linear(to-r, brand.400, brand.600)';
    default:
      return 'linear(to-r, gray.400, gray.600)';
  }
}

// Enhanced Gender gradient backgrounds

function getGenderColor(gender?: string): string {
  if (gender === Gender.MALE) return 'brand';
  if (gender === Gender.FEMALE) return 'pink';
  if (gender === Gender.OTHER) return 'purple';
  if (gender === Gender.PREFER_NOT_TO_SAY) return 'gray';
  return 'gray';
}

interface PlayerListItemProps {
  player: Player;
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
  onToggleStatus: (playerId: string) => void;
  onShowQR: (player: Player) => void;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  onEdit,
  onDelete,
  onToggleStatus,
  onShowQR,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  const tClubs = useTranslations('clubs');
  const { getLevelShortLabel } = useLevelLabel();

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case Gender.MALE:
        return tCommon('male');
      case Gender.FEMALE:
        return tCommon('female');
      case Gender.OTHER:
        return tCommon('other');
      case Gender.PREFER_NOT_TO_SAY:
        return tCommon('preferNotToSay');
      default:
        return '?';
    }
  };

  return (
    <Card
      width="100%"
      variant="outline"
      bg="white"
      boxShadow="0 2px 8px rgba(0,0,0,0.06)"
      mb={0}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.100"
      position="relative"
      zIndex={isMenuOpen ? 1000 : 1}
      overflow="visible"
      cursor="pointer"
      onClick={() => onShowQR(player)}
      transition="box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease"
      _hover={{
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        borderColor: 'gray.200',
        transform: 'translateY(-1px)',
      }}
      _before={{
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        bgGradient: getStatusGradient(player.status),
        borderRadius: '4px 0 0 4px',
      }}
    >
      <CardBody p={{ base: 4, md: 5 }}>
        <Flex justify="space-between" align="center" gap={4}>
          <Flex flex="1" gap={{ base: 3, md: 4 }} align="center">
            {/* Enhanced Avatar */}
            <PlayerAvatar
              name={player.name || ''}
              gender={player.gender}
              status={player.status}
              image={player.user?.image}
              size="56px"
            />

            {/* Info Section */}
            <VStack align="start" spacing={2} flex="1">
              {/* Name Row */}
              <HStack spacing={2} align="center">
                <Badge
                  bg="gray.100"
                  color="gray.600"
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  fontSize="xs"
                  fontWeight="semibold"
                >
                  #{player.playerNumber}
                </Badge>
                <Text
                  fontWeight="bold"
                  fontSize={{ base: 'md', md: 'lg' }}
                  color="gray.800"
                  truncate
                  letterSpacing="-0.01em"
                >
                  {player.name}
                </Text>
              </HStack>

              {/* Badges Row */}
              <HStack spacing={2} wrap="wrap" rowGap={2}>
                {/* Level Badge with icon */}
                <Badge
                  display="flex"
                  alignItems="center"
                  gap={1}
                  bg="purple.50"
                  color="purple.700"
                  borderRadius="lg"
                  px={2.5}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                  border="1px solid"
                  borderColor="purple.100"
                >
                  <Box as={Zap} boxSize="12px" />
                  {getLevelShortLabel(player.level)}
                </Badge>

                {/* Gender Badge */}
                <Badge
                  display="flex"
                  alignItems="center"
                  gap={1}
                  bg={`${getGenderColor(player.gender)}.50`}
                  color={`${getGenderColor(player.gender)}.700`}
                  borderRadius="lg"
                  px={2.5}
                  py={1}
                  fontSize="xs"
                  fontWeight="semibold"
                  border="1px solid"
                  borderColor={`${getGenderColor(player.gender)}.100`}
                >
                  <Box as={User} boxSize="12px" />
                  {getGenderLabel(player.gender)}
                </Badge>

                {/* Fixed Member Badge */}
                {player.isClubMember && player.club && (
                  <Badge
                    display="flex"
                    alignItems="center"
                    gap={1}
                    bg={
                      player.club.color ? `${player.club.color}.50` : 'teal.50'
                    }
                    color={
                      player.club.color
                        ? `${player.club.color}.700`
                        : 'teal.700'
                    }
                    borderRadius="lg"
                    px={2.5}
                    py={1}
                    fontSize="xs"
                    fontWeight="semibold"
                    border="1px solid"
                    borderColor={
                      player.club.color
                        ? `${player.club.color}.100`
                        : 'teal.100'
                    }
                  >
                    <Box as={UserCheck} boxSize="12px" />
                    {player.club.name}
                  </Badge>
                )}

                {/* Monthly Fixed Member Badge (read-only) */}
                {player.clubFeeApplied && (
                  <Badge
                    display="flex"
                    alignItems="center"
                    gap={1}
                    bg="teal.50"
                    color="teal.700"
                    borderRadius="lg"
                    px={2.5}
                    py={1}
                    fontSize="xs"
                    fontWeight="semibold"
                    border="1px solid"
                    borderColor="teal.100"
                  >
                    <Box as={UserCheck} boxSize="12px" />
                    {tClubs('monthlyFixedMember')}
                  </Badge>
                )}

                {/* Status Badge - More prominent */}
                {/* <Badge
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  colorPalette={statusInfo.color}
                  variant="solid"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  {...(isPlaying && {
                    boxShadow: '0 0 0 2px rgba(72, 187, 120, 0.3)',
                  })}
                >
                  <Box as={statusInfo.icon} boxSize="12px" />
                  {player.status}
                </Badge> */}
              </HStack>

              {/* Confirmation Status - Enhanced */}
              {(player.requireConfirmInfo || player.confirmedByPlayer) && (
                <HStack
                  spacing={2}
                  mt={1}
                  bg={player.requireConfirmInfo ? 'orange.50' : 'green.50'}
                  px={3}
                  py={1.5}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={
                    player.requireConfirmInfo ? 'orange.100' : 'green.100'
                  }
                >
                  {player.requireConfirmInfo ? (
                    <Box as={AlertCircle} boxSize="14px" color="orange.500" />
                  ) : (
                    <Box as={UserCheck} boxSize="14px" color="green.500" />
                  )}
                  <Text
                    fontSize="xs"
                    color={
                      player.requireConfirmInfo ? 'orange.700' : 'green.700'
                    }
                    fontWeight="medium"
                  >
                    {player.requireConfirmInfo
                      ? t('awaitingPlayerConfirmation')
                      : t('confirmedByPlayer')}
                  </Text>
                </HStack>
              )}
            </VStack>
          </Flex>

          {/* Action Menu */}
          <PlayerActionMenu
            player={player}
            onShowQR={onShowQR}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            t={t}
            onOpenChange={setIsMenuOpen}
          />
        </Flex>
      </CardBody>
    </Card>
  );
};

export default PlayerListItem;
