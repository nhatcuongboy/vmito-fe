import {
  Badge,
  Box,
  Flex,
  Text,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  Card,
  CardBody,
  HStack,
  VStack,
  IconButton,
  Button
} from '@/components/ui/chakra-compat';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import {
  AlertCircle,
  Edit,
  MoreVertical,
  QrCode,
  Trash2,
  UserCheck,
  PlayCircle,
  Clock,
  CheckCircle2,
  Zap,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState, useRef, useEffect } from 'react';
import { Player } from './types';
import { Gender } from '@/lib/api/types';

// Animation for playing status - enhanced pulse
const pulseRing = keyframes`
  0% { transform: scale(0.8); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 0.4; }
  100% { transform: scale(0.8); opacity: 0.8; }
`;

// Subtle glow animation
const glowPulse = keyframes`
  0% { box-shadow: 0 0 5px rgba(72, 187, 120, 0.4); }
  50% { box-shadow: 0 0 20px rgba(72, 187, 120, 0.6); }
  100% { box-shadow: 0 0 5px rgba(72, 187, 120, 0.4); }
`;

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
      return 'blue.500';
    default:
      return 'gray.400';
  }
}

function getStatusGradient(status: string) {
  switch (status) {
    case 'PLAYING':
      return 'linear(to-r, green.400, green.600)';
    case 'WAITING':
      return 'linear(to-r, orange.400, orange.600)';
    case 'READY':
      return 'linear(to-r, blue.400, blue.600)';
    default:
      return 'linear(to-r, gray.400, gray.600)';
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PLAYING':
      return { color: 'green', icon: PlayCircle, label: 'Playing' };
    case 'WAITING':
      return { color: 'orange', icon: Clock, label: 'Waiting' };
    case 'READY':
      return { color: 'blue', icon: CheckCircle2, label: 'Ready' };
    default:
      return { color: 'gray', icon: AlertCircle, label: 'Unknown' };
  }
}

// Enhanced Gender gradient backgrounds
function getGenderGradient(gender?: string): string {
  if (gender === Gender.MALE) return 'linear(135deg, #3182ce 0%, #63b3ed 100%)';
  if (gender === Gender.FEMALE) return 'linear(135deg, #d53f8c 0%, #f687b3 100%)';
  if (gender === Gender.OTHER) return 'linear(135deg, #805ad5 0%, #b794f4 100%)';
  if (gender === Gender.PREFER_NOT_TO_SAY) return 'linear(135deg, #718096 0%, #a0aec0 100%)';
  return 'linear(135deg, #718096 0%, #a0aec0 100%)';
}

function getGenderColor(gender?: string): string {
  if (gender === Gender.MALE) return 'blue';
  if (gender === Gender.FEMALE) return 'pink';
  if (gender === Gender.OTHER) return 'purple';
  if (gender === Gender.PREFER_NOT_TO_SAY) return 'gray';
  return 'gray';
}



// Enhanced Avatar with gradient and better styling
const EnhancedAvatar = ({ name, gender, status, image }: { name: string, gender?: string, status: string, image?: string | null }) => {
  const isPlaying = status === 'PLAYING';
  
  // Gradient colors based on gender
  const gradientColors = {
    [Gender.MALE]: { bg: 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)', ring: 'blue.300' },
    [Gender.FEMALE]: { bg: 'linear-gradient(135deg, #ed64a6 0%, #f687b3 100%)', ring: 'pink.300' },
    [Gender.OTHER]: { bg: 'linear-gradient(135deg, #9f7aea 0%, #b794f4 100%)', ring: 'purple.300' },
    [Gender.PREFER_NOT_TO_SAY]: { bg: 'linear-gradient(135deg, #a0aec0 0%, #cbd5e0 100%)', ring: 'gray.300' },
  };
  
  const colors = gradientColors[gender as keyof typeof gradientColors] || gradientColors[Gender.PREFER_NOT_TO_SAY];
  
  return (
    <Box position="relative">
      {/* Outer glow ring for playing status */}
      {isPlaying && (
        <Box
          position="absolute"
          top="-4px"
          left="-4px"
          right="-4px"
          bottom="-4px"
          borderRadius="full"
          bg="transparent"
          border="2px solid"
          borderColor="green.400"
          animation={`${pulseRing} 2s ease-in-out infinite`}
        />
      )}
      
      {/* Avatar */}
      <Flex
        width="56px"
        height="56px"
        borderRadius="full"
        background={image ? 'transparent' : colors.bg}
        color="white"
        align="center"
        justify="center"
        fontWeight="bold"
        fontSize="lg"
        letterSpacing="0.5px"
        boxShadow={isPlaying 
          ? '0 4px 14px rgba(72, 187, 120, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)'
        }
        border="3px solid"
        borderColor={isPlaying ? 'green.400' : 'white'}
        transition="all 0.3s ease"
        overflow="hidden"
        _hover={{
          transform: 'scale(1.05)',
        }}
      >
        {image ? (
          <Box
            as="img"
            // @ts-expect-error - src and alt are valid for as="img"
            src={image}
            alt={name || 'Avatar'}
            width="100%"
            height="100%"
            objectFit="cover"
          />
        ) : (
          getInitials(name)
        )}
      </Flex>
      
      {/* Status indicator dot */}
      <Box
        position="absolute"
        bottom="0"
        right="0"
        width="16px"
        height="16px"
        bg={getStatusColor(status)}
        borderRadius="full"
        border="3px solid white"
        boxShadow="0 2px 4px rgba(0,0,0,0.2)"
        {...(isPlaying && {
          animation: `${glowPulse} 2s ease-in-out infinite`,
        })}
      />
    </Box>
  );
};

const PlayerActionMenu = ({ 
  player, 
  onShowQR, 
  onEdit, 
  onDelete, 
  t 
}: { 
  player: Player, 
  onShowQR: (p: Player) => void, 
  onEdit: (p: Player) => void, 
  onDelete: (id: string) => void,
  t: (key: string) => string 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <Box position="relative" ref={menuRef}>
      <IconButton
        aria-label="Options"
        icon={<MoreVertical size={18} />}
        variant="ghost"
        size="sm"
        color="gray.400"
        borderRadius="full"
        _hover={{ 
          bg: 'gray.100', 
          color: 'gray.600',
          transform: 'scale(1.1)',
        }}
        transition="all 0.2s"
        onClick={() => setIsOpen(!isOpen)}
      />
      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          right={0}
          mt={2}
          bg="white"
          boxShadow="0 10px 40px rgba(0,0,0,0.15)"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.100"
          zIndex={10}
          minW="180px"
          overflow="hidden"
          py={2}
        >
          <Button
            variant="ghost"
            width="100%"
            justifyContent="flex-start"
            px={4}
            py={3}
            height="auto"
            onClick={() => { onShowQR(player); setIsOpen(false); }}
            borderRadius={0}
            _hover={{ bg: 'blue.50', color: 'blue.600' }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box p={1.5} bg="blue.100" borderRadius="md">
                <QrCode size={14} color="#3182ce" />
              </Box>
              <Text fontSize="sm" fontWeight="medium">{t('showQRCode')}</Text>
            </HStack>
          </Button>
          <Button
            variant="ghost"
            width="100%"
            justifyContent="flex-start"
            px={4}
            py={3}
            height="auto"
            onClick={() => { onEdit(player); setIsOpen(false); }}
            borderRadius={0}
            _hover={{ bg: 'purple.50', color: 'purple.600' }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box p={1.5} bg="purple.100" borderRadius="md">
                <Edit size={14} color="#805ad5" />
              </Box>
              <Text fontSize="sm" fontWeight="medium">{t('editPlayer')}</Text>
            </HStack>
          </Button>
          <Box mx={3} my={2} borderTop="1px solid" borderColor="gray.100" />
          <Button
            variant="ghost"
            width="100%"
            justifyContent="flex-start"
            px={4}
            py={3}
            height="auto"
            onClick={() => { onDelete(player.id); setIsOpen(false); }}
            borderRadius={0}
            _hover={{ bg: 'red.50' }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box p={1.5} bg="red.100" borderRadius="md">
                <Trash2 size={14} color="#e53e3e" />
              </Box>
              <Text fontSize="sm" fontWeight="medium" color="red.500">{t('deletePlayer')}</Text>
            </HStack>
          </Button>
        </Box>
      )}
    </Box>
  );
};

interface PlayerListItemProps {
  player: Player;
  isEditing: Player | undefined;
  availableLevels: number[];
  isSaving: boolean;
  onEdit: (player: Player) => void;
  onCancelEdit: (playerId: string) => void;
  onSave: (playerId: string) => void;
  onUpdateEditing: (playerId: string, field: string, value: string | boolean) => void;
  onDelete: (playerId: string) => void;
  onShowQR: (player: Player) => void;
}

const PlayerListItem: React.FC<PlayerListItemProps> = ({
  player,
  onEdit,
  onDelete,
  onShowQR,
}) => {
  const t = useTranslations('pages.playerManagement');
  const tCommon = useTranslations('common');
  const { getLevelShortLabel } = useLevelLabel();
  
  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case Gender.MALE: return tCommon('male');
      case Gender.FEMALE: return tCommon('female');
      case Gender.OTHER: return tCommon('other');
      case Gender.PREFER_NOT_TO_SAY: return tCommon('preferNotToSay');
      default: return '?';
    }
  };
  
  const statusColor = getStatusColor(player.status);
  const statusInfo = getStatusBadge(player.status);
  const isPlaying = player.status === 'PLAYING';

  return (
    <Card
      width="100%"
      variant="outline"
      bg="white"
      boxShadow="0 2px 8px rgba(0,0,0,0.06)"
      mb={3}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.100"
      position="relative"
      overflow="visible"
      transition="box-shadow 0.2s ease, border-color 0.2s ease"
      _hover={{ 
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        borderColor: 'gray.200',
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
            <EnhancedAvatar 
              name={player.name || ''} 
              gender={player.gender} 
              status={player.status} 
              image={player.user?.image}
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

                {/* Status Badge - More prominent */}
                {/* <Badge
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  colorScheme={statusInfo.color}
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
                  borderColor={player.requireConfirmInfo ? 'orange.100' : 'green.100'}
                >
                  {player.requireConfirmInfo ? (
                    <Box as={AlertCircle} boxSize="14px" color="orange.500" />
                  ) : (
                    <Box as={UserCheck} boxSize="14px" color="green.500" />
                  )}
                  <Text 
                    fontSize="xs" 
                    color={player.requireConfirmInfo ? 'orange.700' : 'green.700'}
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
            t={t}
          />
        </Flex>
      </CardBody>
    </Card>
  );
};

export default PlayerListItem;
