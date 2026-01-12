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
import { CommonModal } from '@/components/ui/CommonModal';
import { Mars, Venus, Users, User, X, Copy, QrCode } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toaster } from '@/components/ui/toaster';

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
    toaster.success({ title: 'Join code copied to clipboard!' });
  };

  const handleCopyUrl = () => {
    const joinUrl = `${window.location.origin}/join/${sessionId}?player=${player.playerNumber}`;
    navigator.clipboard.writeText(joinUrl);
    toaster.success({ title: 'Join URL copied to clipboard!' });
  };

  if (!isOpen) return null;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <HStack gap={2}>
          <Text color="orange.700">#{player.playerNumber}</Text>
          <Text>{player.name || `Player ${player.playerNumber}`}</Text>
        </HStack>
      }
      size="md"
      showCloseButton={true}
    >
      <VStack gap={6} align="stretch" py={2}>
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
          <VStack gap={4} align="stretch" pt={4} borderTop="1px" borderColor="gray.100">
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
                  flex="1"
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
    </CommonModal>
  );
};
