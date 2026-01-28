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
  Separator,
  Collapsible,
  Avatar,
} from '@chakra-ui/react';
import { useLevelLabel } from '@/hooks/useLevelLabel';
import { CommonModal } from '@/components/ui/CommonModal';
import {
  Mars,
  Venus,
  Users,
  User,
  X,
  Copy,
  QrCode,
  Activity,
  Trophy,
  Clock,
  History,
  Layout,
  ChevronDown,
  ChevronUp,
  Link,
  Star,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toaster } from '@/components/ui/toaster';
import { useTranslations, useLocale } from 'next-intl';
import { SessionService } from '@/lib/api/session.service';
import { RatingService } from '@/lib/api/rating.service';
import { Pause, Play } from 'lucide-react';
import { StarRatingDisplay, RatingList } from '@/components/rating';

import { Player, UserRatingStats, Rating } from '@/lib/api/types';

interface IPlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  sessionId?: string;
  formatWaitTime: (waitTimeInMinutes: number) => string;
  onPlayerUpdate?: () => void;
}

export const PlayerDetailModal = ({
  isOpen,
  onClose,
  player,
  sessionId,
  formatWaitTime,
  onPlayerUpdate,
}: IPlayerDetailModalProps) => {
  const t = useTranslations('PlayerDetailModal');
  const ratingT = useTranslations('rating');
  const locale = useLocale();
  const { getLevelLabel } = useLevelLabel();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [showJoinMore, setShowJoinMore] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [ratingStats, setRatingStats] = useState<UserRatingStats | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [ratingLoading, setRatingLoading] = useState(false);

  const handleToggleStatus = async () => {
    if (!sessionId) return;
    setIsToggling(true);
    try {
      await SessionService.togglePlayerInactive(sessionId, player.id);
      onPlayerUpdate?.();
      toaster.success({
        title:
          player.status === 'INACTIVE'
            ? 'Player status set to Waiting'
            : 'Player status set to Inactive',
      });
    } catch (error) {
      console.error('Failed to toggle player status:', error);
      toaster.error({ title: 'Failed to update player status' });
    } finally {
      setIsToggling(false);
    }
  };

  useEffect(() => {
    if (isOpen && player.joinCode) {
      // Use player's joinCode
      setJoinCode(player.joinCode);

      // Generate QR code URL with new guest player URL format
      const joinUrl = `${window.location.origin}/${locale}/player/${player.id}?code=${player.joinCode}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        joinUrl
      )}`;
      setQrCodeUrl(qrUrl);
    }
  }, [isOpen, player.id, player.joinCode]);

  // Fetch rating stats when modal opens and player has userId
  useEffect(() => {
    const fetchRatingData = async () => {
      if (!isOpen || !player.userId) return;

      setRatingLoading(true);
      try {
        const [stats, receivedRatings] = await Promise.all([
          RatingService.getUserRatingStats(player.userId),
          RatingService.getUserReceivedRatings(player.userId),
        ]);
        setRatingStats(stats);
        setRatings(receivedRatings);
      } catch (error) {
        console.error('Failed to fetch rating data:', error);
      } finally {
        setRatingLoading(false);
      }
    };

    fetchRatingData();
  }, [isOpen, player.userId]);

  const handleCopyCode = () => {
    if (player.joinCode) {
      navigator.clipboard.writeText(player.joinCode);
      toaster.success({ title: t('joinCodeCopied') });
    }
  };

  const handleCopyUrl = () => {
    if (player.joinCode) {
      const joinUrl = `${window.location.origin}/${locale}/player/${player.id}?code=${player.joinCode}`;
      navigator.clipboard.writeText(joinUrl);
      toaster.success({ title: t('joinUrlCopied') });
    }
  };

  if (!isOpen) return null;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <HStack gap={3}>
          <Box
            bg="orange.100"
            color="orange.700"
            px={2}
            py={0.5}
            borderRadius="md"
            fontSize="sm"
            fontWeight="bold"
          >
            #{player.playerNumber}
          </Box>
          <Text fontSize="xl" fontWeight="bold" letterSpacing="tight">
            {t('playerDetails')}
          </Text>
        </HStack>
      }
      size="md"
      showCloseButton={true}
      footer={
        <Flex justify="space-between" width="full" align="center">
          <Box>
            {sessionId &&
              (player.status === 'WAITING' ||
                player.status === 'INACTIVE') && (
                <Button
                  size="sm"
                  colorPalette={player.status === 'WAITING' ? 'red' : 'gray'}
                  onClick={handleToggleStatus}
                  loading={isToggling}
                >
                  {player.status === 'WAITING' ? (
                    <>
                      <Pause size={16} style={{ marginRight: '8px' }} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={16} style={{ marginRight: '8px' }} />
                      Continue
                    </>
                  )}
                </Button>
              )}
          </Box>
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
        </Flex>
      }
    >
      <VStack gap={0} align="stretch">
        {/* Player Header Avatar & Name */}
        <VStack gap={4} mb={6} align="center">
          <Box position="relative">
            <Avatar.Root
              boxSize="80px"
              borderRadius="full"
              borderWidth="2px"
              borderColor="blue.500"
            >
              <Avatar.Fallback
                name={player.name || `Player ${player.playerNumber}`}
              >
                <User size={40} />
              </Avatar.Fallback>
              {player.user?.image && <Avatar.Image src={player.user.image} />}
            </Avatar.Root>
          </Box>
          <Text fontSize="2xl" fontWeight="bold" textAlign="center">
            {player.name || `Player ${player.playerNumber}`}
          </Text>
        </VStack>

        {/* Player Info Stats Grid */}
        <VStack gap={1} align="stretch" mb={4}>
          <InfoRow
            icon={<Activity size={16} />}
            label={t('status')}
            value={
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
                size="sm"
                borderRadius="full"
                px={3}
              >
                {t(`statusValues.${player.status.toLowerCase()}`)}
              </Badge>
            }
          />

          <InfoRow
            icon={<Users size={16} />}
            label={t('gender')}
            value={
              <Badge
                variant="subtle"
                colorPalette={
                  player.gender === 'MALE'
                    ? 'blue'
                    : player.gender === 'FEMALE'
                      ? 'pink'
                      : 'gray'
                }
                display="flex"
                alignItems="center"
                gap={1.5}
                size="sm"
                px={2}
              >
                {player.gender === 'MALE' ? (
                  <Mars size={12} />
                ) : player.gender === 'FEMALE' ? (
                  <Venus size={12} />
                ) : (
                  <User size={12} />
                )}
                {player.gender
                  ? t(`genderValues.${player.gender.toLowerCase()}`)
                  : t('unknown')}
              </Badge>
            }
          />

          <InfoRow
            icon={<Trophy size={16} />}
            label={t('level')}
            value={
              <Badge variant="subtle" colorPalette="purple" size="sm">
                {getLevelLabel(player.level)}
              </Badge>
            }
          />

          {player.phone && (
            <InfoRow
              icon={<Users size={16} />}
              label={t('phone')}
              value={
                <Text fontWeight="medium" color="gray.800">
                  {player.phone}
                </Text>
              }
            />
          )}

          {player.levelDescription && (
            <InfoRow
              icon={<Activity size={16} />}
              label={t('levelDescription')}
              value={
                <Text fontWeight="medium" color="gray.800">
                  {player.levelDescription}
                </Text>
              }
            />
          )}

          {player.desire && (
            <InfoRow
              icon={<Trophy size={16} />}
              label={t('desire')}
              value={
                <Text fontWeight="medium" color="gray.800">
                  {player.desire}
                </Text>
              }
            />
          )}

          <Separator my={2} opacity={0.5} />

          <InfoRow
            icon={<History size={16} />}
            label={t('matchesPlayed')}
            value={
              <Text fontWeight="bold" color="gray.800">
                {player.matchesPlayed}
              </Text>
            }
          />

          {(player.status === 'WAITING' || player.status === 'READY') && (
            <InfoRow
              icon={<Clock size={16} />}
              label={t('waitTime')}
              value={
                <Badge
                  colorPalette={
                    player.currentWaitTime > 15
                      ? 'red'
                      : player.currentWaitTime > 10
                        ? 'yellow'
                        : 'gray'
                  }
                  variant="solid"
                  borderRadius="md"
                >
                  {formatWaitTime(player.currentWaitTime)}
                </Badge>
              }
            />
          )}

          <InfoRow
            icon={<Clock size={16} />}
            label={t('totalWaitTime')}
            value={
              <Text fontWeight="bold" color="gray.700">
                {formatWaitTime(player.totalWaitTime)}
              </Text>
            }
          />

          {(player.currentCourtId || player.currentCourt) && (
            <InfoRow
              icon={<Layout size={16} />}
              label={t('currentCourt')}
              value={
                <Badge variant="solid" colorPalette="green" px={3}>
                  {player.currentCourt?.courtName ||
                    (player.currentCourt?.courtNumber
                      ? `${player.currentCourt.courtNumber}`
                      : player.currentCourtId)}
                </Badge>
              }
            />
          )}

          {/* Rating Section - Show if player has userId */}
          {player.userId && (
            <>
              <Separator my={2} opacity={0.5} />
              <InfoRow
                icon={<Star size={16} />}
                label={ratingT('averageRating')}
                value={
                  ratingLoading ? (
                    <Text fontSize="sm" color="gray.400">...</Text>
                  ) : ratingStats && ratingStats.totalRatings > 0 ? (
                    <StarRatingDisplay
                      rating={ratingStats.averageRating}
                      count={ratingStats.totalRatings}
                      size="sm"
                      variant="compact"
                    />
                  ) : (
                    <Text fontSize="sm" color="gray.400">
                      {ratingT('noRatingsYet')}
                    </Text>
                  )
                }
              />
            </>
          )}
        </VStack>

        {/* View Reviews Section */}
        {player.userId && ratings.length > 0 && (
          <Box pt={4} borderTopWidth="1px" borderColor="gray.100">
            <Collapsible.Root
              open={showReviews}
              onOpenChange={(e) => setShowReviews(e.open)}
            >
              <Collapsible.Trigger asChild>
                <Button
                  variant="ghost"
                  width="full"
                  justifyContent="space-between"
                  px={4}
                  py={2}
                  height="auto"
                  _hover={{ bg: 'orange.50' }}
                  color="orange.600"
                >
                  <HStack gap={2}>
                    <Star size={18} />
                    <Text fontWeight="bold">
                      {ratingT('viewReviews')} ({ratings.length})
                    </Text>
                  </HStack>
                  {showReviews ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <Box py={4} px={2}>
                  <RatingList
                    ratings={ratings.slice(0, 5)}
                    isLoading={ratingLoading}
                    showRater={true}
                    showRated={false}
                  />
                </Box>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )}

        {/* Join Session Section - Show More */}
        {sessionId && (
          <Box pt={4} borderTopWidth="1px" borderColor="gray.100">
            <Collapsible.Root
              open={showJoinMore}
              onOpenChange={(e) => setShowJoinMore(e.open)}
            >
              <Collapsible.Trigger asChild>
                <Button
                  variant="ghost"
                  width="full"
                  justifyContent="space-between"
                  px={4}
                  py={2}
                  height="auto"
                  _hover={{ bg: 'blue.50' }}
                  color="blue.600"
                >
                  <HStack gap={2}>
                    <QrCode size={18} />
                    <Text fontWeight="bold">{t('joinSessionInfo')}</Text>
                  </HStack>
                  {showJoinMore ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <VStack gap={4} py={4} px={2}>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {t('qrCodeDescription')}
                  </Text>

                  {qrCodeUrl && (
                    <Box
                      p={3}
                      bg="white"
                      borderRadius="xl"
                      boxShadow="sm"
                      borderWidth="1px"
                      borderColor="gray.100"
                    >
                      <Image
                        src={qrCodeUrl}
                        alt="QR Code to join session"
                        borderRadius="md"
                        boxSize="180px"
                      />
                    </Box>
                  )}

                  <HStack width="full" gap={2}>
                    <Button
                      variant="subtle"
                      colorPalette="blue"
                      flex={1}
                      onClick={handleCopyUrl}
                      size="sm"
                    >
                      <Link size={14} />
                      {t('copyUrl')}
                    </Button>
                    <Button
                      variant="subtle"
                      colorPalette="gray"
                      flex={1}
                      onClick={handleCopyCode}
                      size="sm"
                    >
                      <Copy size={14} />
                      {t('copyId')}
                    </Button>
                  </HStack>
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>
          </Box>
        )}
      </VStack>
    </CommonModal>
  );
};

// Helper component for consistent rows
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <HStack
    justifyContent="space-between"
    py={2}
    px={2}
    borderRadius="md"
    _hover={{ bg: 'gray.50' }}
  >
    <HStack gap={3} color="gray.500">
      <Box color="blue.500">{icon}</Box>
      <Text fontWeight="medium" fontSize="sm">
        {label}:
      </Text>
    </HStack>
    <Box>{value}</Box>
  </HStack>
);
