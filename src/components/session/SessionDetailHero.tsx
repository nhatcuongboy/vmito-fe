'use client';

import { ISession } from '@/lib/api/types';
import { Box, Badge, Icon, Image } from '@chakra-ui/react';
import { IconButton } from '@/components/ui/chakra-compat';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DEFAULT_COVER_PHOTO } from '@/constants';
import { statusColors, getStatusLabel } from './BaseSessionCard';
import { toaster } from '@/components/ui/toaster';

interface ISessionDetailHeroProps {
  session: ISession;
  availableSlots: number;
  isFull: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

const SessionDetailHero = ({
  session,
  availableSlots,
  isFull,
  onBack,
  showBackButton = true,
}: ISessionDetailHeroProps) => {
  const t = useTranslations('session');

  const handleShare = async () => {
    const shareData = {
      title: session.name,
      text: `${t('checkOutThisSession')}: ${session.name}`,
      url: `${window.location.origin}/sessions/${session.slug || session.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toaster.success({ title: t('linkCopied') });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const isPastEndTime = session.endTime
    ? new Date(session.endTime) < new Date()
    : false;

  const statusColorPalette =
    session.status === 'PREPARING' && isPastEndTime
      ? 'gray'
      : statusColors[session.status] || 'gray';

  return (
    <Box
      position="relative"
      w="full"
      h={{ base: 'clamp(170px, 29vh, 235px)', md: '350px' }}
    >
      {/* Cover Photo */}
      <Image
        src={session.coverPhoto || DEFAULT_COVER_PHOTO}
        alt={session.name}
        w="100%"
        h="100%"
        objectFit="cover"
      />

      {/* Top gradient overlay for buttons */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="80px"
        bgGradient="to-b"
        gradientFrom="blackAlpha.500"
        gradientTo="transparent"
        pointerEvents="none"
      />

      {/* Bottom gradient overlay for badges */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        h="80px"
        bgGradient="to-t"
        gradientFrom="blackAlpha.500"
        gradientTo="transparent"
        pointerEvents="none"
      />

      {/* Back Button */}
      {showBackButton && onBack && (
        <IconButton
          aria-label="Back"
          variant="ghost"
          size="sm"
          position="absolute"
          top="calc(env(safe-area-inset-top) + 12px)"
          left={3}
          color="white"
          bg="blackAlpha.500"
          backdropFilter="blur(6px)"
          borderRadius="full"
          boxShadow="0 2px 8px rgba(0,0,0,0.45)"
          _hover={{ bg: 'blackAlpha.700' }}
          zIndex={10}
          onClick={onBack}
          icon={<Icon as={ArrowLeft} boxSize={5} />}
        />
      )}

      {/* Share Button */}
      <IconButton
        aria-label="Share"
        variant="ghost"
        size="sm"
        position="absolute"
        top="calc(env(safe-area-inset-top) + 12px)"
        right={3}
        color="white"
        bg="blackAlpha.500"
        backdropFilter="blur(6px)"
        borderRadius="full"
        boxShadow="0 2px 8px rgba(0,0,0,0.45)"
        _hover={{ bg: 'blackAlpha.700' }}
        zIndex={10}
        onClick={handleShare}
        icon={<Icon as={Share2} boxSize={5} />}
      />

      {/* Slot Availability Badge - bottom left */}
      <Badge
        position="absolute"
        bottom={5}
        left={3}
        colorPalette={isFull ? 'gray' : 'teal'}
        variant="solid"
        fontSize="sm"
        px={3}
        py={1}
        borderRadius="full"
        fontWeight="600"
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
        backdropFilter="blur(8px)"
      >
        {isFull
          ? t('slotsFull')
          : t('slotsAvailable', { count: availableSlots })}
      </Badge>

      {/* Status Badge - bottom right */}
      <Badge
        position="absolute"
        bottom={5}
        right={3}
        colorPalette={statusColorPalette}
        variant="solid"
        fontSize="sm"
        px={3}
        py={1}
        borderRadius="full"
        fontWeight="600"
        boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
        backdropFilter="blur(8px)"
      >
        {getStatusLabel(session.status, t, session.endTime)}
      </Badge>
    </Box>
  );
};

export default SessionDetailHero;
