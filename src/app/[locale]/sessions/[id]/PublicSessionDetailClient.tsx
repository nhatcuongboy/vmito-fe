'use client';

import { ISession } from '@/lib/api/types';
import { Container, Box, Flex, Icon, Text, Heading, Image } from '@chakra-ui/react';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { MapPin, Phone, Share2, Calendar, Clock, Users, SquareAsterisk, DollarSign } from 'lucide-react';
import TopBar from '@/components/ui/TopBar';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { useModal } from '@/components/ui/CommonModal';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import { toaster } from '@/components/ui/toaster';
import { formatDate, formatTime } from '@/utils/session-helpers';

interface PublicSessionDetailClientProps {
  session: ISession;
}

const PublicSessionDetailClient = ({ session }: PublicSessionDetailClientProps) => {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const { user } = useAuthStore();

  const {
    isOpen: isLoginModalOpen,
    onOpen: onOpenLoginModal,
    onClose: onCloseLoginModal,
  } = useModal();

  // Check if current user is the session owner/host
  const isOwner = session.hostId === user?.id;

  // Calculate if session is full (only count approved players)
  const maxPlayers = session.numberOfCourts * session.maxPlayersPerCourt;
  const approvedPlayersCount = session._count?.players || 0;
  const isFull = approvedPlayersCount >= maxPlayers;

  // Handle share
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: session.name,
          text: session.description || `Join ${session.name}`,
          url: url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toaster.success({ title: t('linkCopied') || 'Link copied to clipboard' });
      } catch (error) {
        toaster.error({ title: tCommon('error') });
      }
    }
  };

  // Format fee display
  const getFeeDisplay = () => {
    if (!session.feeConfig) return t('free') || 'Free';

    const { feeType, maleFee, femaleFee, splitPerPlayer } = session.feeConfig;

    if (feeType === 'FIXED') {
      if (maleFee === femaleFee) {
        return `${maleFee?.toLocaleString()} VND`;
      }
      return `${t('male')}: ${maleFee?.toLocaleString()} VND, ${t('female')}: ${femaleFee?.toLocaleString()} VND`;
    } else if (feeType === 'SPLIT_EVENLY' && splitPerPlayer) {
      return `${splitPerPlayer.toLocaleString()} VND/${t('player')}`;
    }

    return t('free') || 'Free';
  };



  return (
    <>
      <TopBar
        icon={<Image src="/icons/app-logo.png" h="32px" alt="Logo" />}
      />
      <Box pt={{ base: 'calc(44px + env(safe-area-inset-top))', md: 'calc(56px + env(safe-area-inset-top))' }}>
        <Container maxW="4xl" py={8}>
          <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            shadow="sm"
          >
            {/* Header */}
            <Box p={6} borderBottomWidth="1px">
              <Flex justify="space-between" align="flex-start" mb={2}>
                <Heading size="lg">{session.name}</Heading>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Share"
                  icon={<Icon as={Share2} />}
                  onClick={handleShare}
                />
              </Flex>
              <Text color="gray.600" fontSize="sm">
                {t('hostedBy')}: {session.host.name}
              </Text>
            </Box>

            {/* Session details */}
            <Box p={6}>
              <Flex direction="column" gap={4}>
                {/* Date & Time */}
                <Flex gap={6} flexWrap="wrap">
                  <Flex align="center" gap={2}>
                    <Icon as={Calendar} boxSize={5} color="blue.500" />
                    <Text>
                      {session.startTime ? formatDate(new Date(session.startTime)) : t('dateNotSet')}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Icon as={Clock} boxSize={5} color="blue.500" />
                    <Text>
                      {session.startTime && session.endTime
                        ? `${formatTime(new Date(session.startTime))} - ${formatTime(new Date(session.endTime))}`
                        : t('timeNotSet')}
                    </Text>
                  </Flex>
                </Flex>

                {/* Location */}
                {(session.venue?.name || session.location) && (
                  <Flex align="flex-start" gap={2}>
                    <Icon as={MapPin} boxSize={5} color="blue.500" mt={1} />
                    <Box flex="1">
                      <Text fontWeight="medium">
                        {session.venue?.name || session.location}
                      </Text>
                      {session.venue?.address && session.venue.address !== session.venue.name && (
                        <Text fontSize="sm" color="gray.500">
                          {session.venue.address}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                )}

                {/* Courts & Players */}
                <Flex gap={6} flexWrap="wrap">
                  <Flex align="center" gap={2}>
                    <Icon as={SquareAsterisk} boxSize={5} color="blue.500" />
                    <Text>
                      {session.numberOfCourts} {session.numberOfCourts > 1 ? t('courts') : t('court')}
                    </Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Icon as={Users} boxSize={5} color="blue.500" />
                    <Text>
                      {approvedPlayersCount}/{maxPlayers} {t('players')}
                    </Text>
                  </Flex>
                </Flex>

                {/* Fee */}
                <Flex align="center" gap={2}>
                  <Icon as={DollarSign} boxSize={5} color="blue.500" />
                  <Text>{getFeeDisplay()}</Text>
                </Flex>

                {/* Required levels */}
                {session.requiredLevels && session.requiredLevels.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      {t('requiredLevels')}:
                    </Text>
                    <Flex gap={2} flexWrap="wrap">
                      {session.requiredLevels.map((level) => (
                        <Box
                          key={level}
                          px={3}
                          py={1}
                          bg="blue.50"
                          color="blue.700"
                          borderRadius="md"
                          fontSize="sm"
                        >
                          {t('level')} {level}
                        </Box>
                      ))}
                    </Flex>
                  </Box>
                )}

                {/* Description */}
                {session.description && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      {t('description')}:
                    </Text>
                    <Text color="gray.600" whiteSpace="pre-wrap">
                      {session.description}
                    </Text>
                  </Box>
                )}
              </Flex>
            </Box>

            {/* Action buttons */}
            <Box p={6} borderTopWidth="1px" bg="gray.50">
              <Flex gap={3} justify="flex-end" flexWrap="wrap">
                {/* Call button */}
                {session.hostPhone && (
                  <IconButton
                    size="sm"
                    colorPalette="blue"
                    variant="outline"
                    aria-label="Call host"
                    icon={<Icon as={Phone} />}
                    onClick={() => {
                      window.location.href = `tel:${session.hostPhone}`;
                    }}
                  />
                )}

                {/* If user owns the session, show Host button */}
                {isOwner ? (
                  <NextLinkButton
                    href={
                      user.role === 'PLAYER'
                        ? `/player/sessions/${session.id}`
                        : `/host/sessions/${session.id}`
                    }
                    colorPalette="blue"
                    size="sm"
                  >
                    {t('host')}
                  </NextLinkButton>
                ) : (
                  /* Otherwise show register button */
                  <Button
                    colorPalette="blue"
                    onClick={() => {
                      if (!user) {
                        onOpenLoginModal();
                        return;
                      }
                      // Redirect to browse sessions page with this session ID
                      window.location.href = `/browse/sessions?sessionId=${session.id}`;
                    }}
                    size="sm"
                    disabled={isFull}
                  >
                    {isFull ? t('sessionFull') : t('register')}
                  </Button>
                )}
              </Flex>
            </Box>
          </Box>
        </Container>

        {/* Login prompt modal */}
        <LoginPromptModal
          isOpen={isLoginModalOpen}
          onClose={onCloseLoginModal}
          returnUrl={`/browse/sessions?sessionId=${session.id}`}
        />
      </Box>
    </>
  );
};

export default PublicSessionDetailClient;
