'use client';

import {
  Box,
  Badge,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Image,
} from '@chakra-ui/react';
import { Level } from '@/lib/api/types';
import { getLevelLabel } from '@/utils/level-mapping';
import { Mars, Venus, Users, User, X, Copy, QrCode } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Player {
  id: string;
  playerNumber: number;
  name?: string;
  gender?: string;
  level?: Level;
  status: string;
  currentWaitTime: number;
  totalWaitTime: number;
  matchesPlayed: number;
  currentCourtId?: string;
  preFilledByHost: boolean;
  confirmedByPlayer: boolean;
}

interface IPlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  sessionId?: string;
  formatWaitTime: (waitTimeInMinutes: number) => string;
}

export const PlayerDetailModal = ({
  isOpen,
  onClose,
  player,
  sessionId,
  formatWaitTime,
}: IPlayerDetailModalProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');

  useEffect(() => {
    if (isOpen && sessionId) {
      // Generate join code (simplified - you might want to get this from API)
      const code = `${sessionId}-${player.playerNumber}`;
      setJoinCode(code);

      // Generate QR code URL (using a QR code service)
      const joinUrl = `${window.location.origin}/join/${sessionId}?player=${player.playerNumber}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        joinUrl
      )}`;
      setQrCodeUrl(qrUrl);
    }
  }, [isOpen, sessionId, player.playerNumber]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(joinCode);
    toast.success('Join code copied to clipboard!');
  };

  const handleCopyUrl = () => {
    const joinUrl = `${window.location.origin}/join/${sessionId}?player=${player.playerNumber}`;
    navigator.clipboard.writeText(joinUrl);
    toast.success('Join URL copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="xl"
        boxShadow="2xl"
        p={6}
        maxW="md"
        w="90%"
        mx={4}
        onClick={(e) => e.stopPropagation()}
        position="relative"
      >
        {/* Close Button */}
        <Button
          position="absolute"
          top={4}
          right={4}
          size="sm"
          variant="ghost"
          onClick={onClose}
        >
          <X size={16} />
        </Button>

        <VStack gap={6} align="stretch">
          {/* Header */}
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="bold" color="orange.700">
              #{player.playerNumber}
            </Text>
            <Text fontSize="lg" fontWeight="semibold" color="gray.800">
              {player.name || `Player ${player.playerNumber}`}
            </Text>
          </VStack>

          {/* Player Info */}
          <VStack gap={4} align="stretch">
            <HStack justifyContent="space-between">
              <Text fontWeight="medium" color="gray.600">
                Status:
              </Text>
              <Badge
                colorPalette={
                  player.status === 'PLAYING'
                    ? 'green'
                    : player.status === 'WAITING'
                      ? 'orange'
                      : player.status === 'READY'
                        ? 'blue'
                        : 'gray'
                }
                variant="solid"
              >
                {player.status}
              </Badge>
            </HStack>

            <HStack justifyContent="space-between">
              <Text fontWeight="medium" color="gray.600">
                Level:
              </Text>
              <Badge variant="outline" colorPalette="purple">
                {getLevelLabel(player.level)}
              </Badge>
            </HStack>

            <HStack justifyContent="space-between">
              <Text fontWeight="medium" color="gray.600">
                Gender:
              </Text>
              <Badge
                variant="solid"
                colorPalette={
                  player.gender === 'MALE'
                    ? 'blue'
                    : player.gender === 'FEMALE'
                      ? 'pink'
                      : player.gender === 'OTHER'
                        ? 'purple'
                        : 'gray'
                }
                display="flex"
                alignItems="center"
                gap={1}
              >
                {player.gender === 'MALE' ? (
                  <Mars size={12} />
                ) : player.gender === 'FEMALE' ? (
                  <Venus size={12} />
                ) : player.gender === 'OTHER' ? (
                  <Users size={12} />
                ) : (
                  <User size={12} />
                )}
                {player.gender || 'Unknown'}
              </Badge>
            </HStack>

            <HStack justifyContent="space-between">
              <Text fontWeight="medium" color="gray.600">
                Matches Played:
              </Text>
              <Text fontWeight="semibold">{player.matchesPlayed}</Text>
            </HStack>

            {(player.status === 'WAITING' || player.status === 'READY') && (
              <HStack justifyContent="space-between">
                <Text fontWeight="medium" color="gray.600">
                  Wait Time:
                </Text>
                <Badge
                  colorPalette={
                    player.currentWaitTime > 15
                      ? 'red'
                      : player.currentWaitTime > 10
                        ? 'yellow'
                        : 'gray'
                  }
                  variant="solid"
                >
                  {formatWaitTime(player.currentWaitTime)}
                </Badge>
              </HStack>
            )}

            <HStack justifyContent="space-between">
              <Text fontWeight="medium" color="gray.600">
                Total Wait Time:
              </Text>
              <Text fontWeight="semibold">
                {formatWaitTime(player.totalWaitTime)}
              </Text>
            </HStack>

            {player.currentCourtId && (
              <HStack justifyContent="space-between">
                <Text fontWeight="medium" color="gray.600">
                  Current Court:
                </Text>
                <Badge variant="solid" colorPalette="green">
                  Court {player.currentCourtId}
                </Badge>
              </HStack>
            )}
          </VStack>

          {/* Join Session Section */}
          {sessionId && (
            <VStack gap={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                Join Session
              </Text>

              {/* QR Code */}
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">
                  Scan QR Code to Join
                </Text>
                {qrCodeUrl && (
                  <Image
                    src={qrCodeUrl}
                    alt="QR Code to join session"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  />
                )}
              </VStack>

              {/* Join Code */}
              <VStack gap={2}>
                <Text fontSize="sm" color="gray.600">
                  Or use join code:
                </Text>
                <HStack>
                  <Box
                    bg="gray.100"
                    px={3}
                    py={2}
                    borderRadius="md"
                    fontFamily="mono"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {joinCode}
                  </Box>
                  <Button size="sm" variant="outline" onClick={handleCopyCode}>
                    <Copy size={14} />
                  </Button>
                </HStack>
              </VStack>

              {/* Copy URL Button */}
              <Button
                variant="outline"
                colorPalette="blue"
                onClick={handleCopyUrl}
              >
                <QrCode size={16} />
                Copy Join URL
              </Button>
            </VStack>
          )}
        </VStack>
      </Box>
    </Box>
  );
};
