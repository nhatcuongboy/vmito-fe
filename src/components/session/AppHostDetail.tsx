'use client';

import { UserRatingSummaryCard } from '@/components/rating/UserRatingSummaryCard';
import { Button, HStack, VStack, Image } from '@/components/ui/chakra-compat';
import { RatingService } from '@/lib/api/rating.service';
import { SessionService } from '@/lib/api/session.service';
import { UserRatingStats } from '@/lib/api/types';
import { getFullSizeAvatarUrl } from '@/lib/utils/image';
import {
  Avatar,
  Box,
  Flex,
  Grid,
  Icon,
  Portal,
  Separator,
  Text,
} from '@chakra-ui/react';
import {
  Check,
  Copy,
  Phone,
  ChevronRight,
  Star,
  MessageCircle,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/config';

interface AppHostDetailProps {
  userId: string;
  name?: string;
  image?: string;
  phone?: string;
  email?: string;
  hideHeader?: boolean;
  allowZaloContact?: boolean;
  onClose?: () => void;
}

export const AppHostDetail = ({
  userId,
  name,
  image,
  phone,
  allowZaloContact = false,
  onClose,
}: AppHostDetailProps) => {
  const t = useTranslations('session.hostDetail');
  const tSession = useTranslations('session');
  const router = useRouter();
  const [stats, setStats] = useState<UserRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [availableSessions, setAvailableSessions] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [ratingData, availableData, hostedData] = await Promise.all([
          RatingService.getUserRatingStats(userId),
          SessionService.getAvailableSessions({ hostId: userId, limit: 1 }),
          SessionService.getPublicSessions(userId, { limit: 1 }),
        ]);
        setStats(ratingData);
        setTotalSessions(hostedData.total ?? 0);
        setAvailableSessions(availableData.pagination.total);
      } catch (error) {
        console.error('Failed to fetch host stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleZalo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      const normalized = phone.replace(/^0/, '84');
      window.open(`https://zalo.me/${normalized}`, '_blank');
    }
  };

  const handleCopyPhone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayRating = stats ? Math.round(stats.averageRating * 10) / 10 : 0;
  const hasRating = !loading && !!stats && stats.totalRatings > 0;

  return (
    <Box
      as="section"
      mx={-4}
      mt={-4}
      mb={-4}
      bg="#F6F7F9"
      _dark={{ bg: 'gray.900' }}
    >
      {/* ===== Hero Header ===== */}
      <Box
        as="header"
        minH="190px"
        px={6}
        pt={7}
        pb={12}
        style={{
          background:
            'linear-gradient(135deg, #16a34a 0%, #15803d 60%, #14532d 100%)',
        }}
      >
        <Flex direction="column" align="center" gap={3}>
          <Avatar.Root
            w="90px"
            h="90px"
            borderWidth="3px"
            borderColor="white"
            boxShadow="0 4px 16px rgba(0,0,0,.08)"
            cursor={image ? 'pointer' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              if (image) setIsAvatarPreviewOpen(true);
            }}
            _hover={image ? { opacity: 0.9 } : undefined}
            transition="opacity 0.2s"
          >
            <Avatar.Fallback
              name={name || 'Host'}
              bg="green.300"
              color="white"
              fontSize="3xl"
              fontWeight="bold"
            >
              {(name || 'H').charAt(0).toUpperCase()}
            </Avatar.Fallback>
            {image && <Avatar.Image src={image} borderRadius="full" />}
          </Avatar.Root>

          <Flex direction="column" align="center" gap={1.5}>
            <Text
              as="h2"
              fontSize="24px"
              fontWeight="bold"
              color="white"
              letterSpacing="tight"
              lineHeight="1.2"
              textAlign="center"
              cursor="pointer"
              role="button"
              _hover={{ textDecoration: 'underline', opacity: 0.9 }}
              transition="opacity 0.2s"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) onClose();
                router.push(`/user/${userId}`);
              }}
            >
              {name || 'Unknown Host'}
            </Text>

            {phone && (
              <Flex
                align="center"
                gap={1.5}
                px={3}
                py={1}
                borderRadius="full"
                bg="whiteAlpha.200"
                onClick={handleCopyPhone}
                cursor="pointer"
                role="button"
                _hover={{ bg: 'whiteAlpha.300' }}
                transition="background 0.2s"
              >
                <Icon as={Phone} boxSize={3.5} color="whiteAlpha.900" />
                <Text fontSize="14px" fontWeight="semibold" color="white">
                  {phone}
                </Text>
                <Icon
                  as={copied ? Check : Copy}
                  boxSize={3.5}
                  color={copied ? 'yellow.300' : 'whiteAlpha.800'}
                  transition="color 0.2s"
                />
              </Flex>
            )}

            {hasRating && stats && (
              <Flex align="center" gap={1.5} mt={0.5}>
                <HStack gap={0.5}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      as={Star}
                      boxSize={3.5}
                      fill={
                        star <= Math.round(stats.averageRating)
                          ? '#FBBF24'
                          : 'rgba(255,255,255,0.35)'
                      }
                      color={
                        star <= Math.round(stats.averageRating)
                          ? '#FBBF24'
                          : 'rgba(255,255,255,0.35)'
                      }
                    />
                  ))}
                </HStack>
                <Text fontSize="14px" fontWeight="bold" color="white">
                  {displayRating.toFixed(1)}
                </Text>
                <Text fontSize="14px" color="whiteAlpha.800">
                  ({stats.totalRatings} {t('rating').toLowerCase()})
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* ===== Body ===== */}
      <VStack gap={4} align="stretch" px={4} pb={6} mt={-6}>
        {/* Statistics Card */}
        {!loading && (
          <Grid
            templateColumns="1fr auto 1fr"
            alignItems="center"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="16px"
            boxShadow="0 4px 16px rgba(0,0,0,.08)"
            p={5}
          >
            <VStack gap={1} textAlign="center">
              <Text
                fontSize="32px"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'gray.100' }}
                lineHeight="1.1"
              >
                {totalSessions}
              </Text>
              <Text
                fontSize="14px"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                fontWeight="medium"
              >
                {t('totalHosted')}
              </Text>
            </VStack>

            <Separator
              orientation="vertical"
              h="56px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
            />

            <VStack gap={1} textAlign="center">
              <Text
                fontSize="32px"
                fontWeight="bold"
                color="green.600"
                _dark={{ color: 'green.400' }}
                lineHeight="1.1"
              >
                {availableSessions}
              </Text>
              <Text
                fontSize="14px"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                fontWeight="medium"
              >
                {t('availableSessions')}
              </Text>
            </VStack>
          </Grid>
        )}

        {/* Rating Card */}
        <Box
          bg="white"
          _dark={{ bg: 'gray.800' }}
          borderRadius="16px"
          boxShadow="0 4px 16px rgba(0,0,0,.08)"
          p={5}
        >
          <Flex align="center" justify="space-between" mb={4}>
            <Text
              fontSize="14px"
              fontWeight="bold"
              color="gray.800"
              _dark={{ color: 'gray.100' }}
            >
              ⭐ {t('rating')}
            </Text>
            {hasRating && stats && stats.averageRating >= 4.5 && (
              <Box
                px={2.5}
                py={0.5}
                borderRadius="full"
                bg="green.50"
                _dark={{ bg: 'green.900' }}
              >
                <Text
                  fontSize="12px"
                  fontWeight="semibold"
                  color="green.600"
                  _dark={{ color: 'green.300' }}
                >
                  Host uy tín
                </Text>
              </Box>
            )}
          </Flex>
          <UserRatingSummaryCard
            stats={stats}
            isLoading={loading}
            showBreakdown
          />
        </Box>

        {/* Action Buttons */}
        {phone && (
          <VStack gap="12px" align="stretch">
            <Button
              colorPalette="green"
              variant="solid"
              width="full"
              height="52px"
              borderRadius="16px"
              onClick={handleCall}
              fontSize="15px"
              fontWeight="bold"
              boxShadow="0 4px 16px rgba(22, 163, 74, 0.25)"
            >
              <Icon as={Phone} mr={2} boxSize={4} strokeWidth={2.5} />
              {t('call')}
            </Button>
            {allowZaloContact && (
              <Button
                colorPalette="green"
                variant="outline"
                width="full"
                height="52px"
                borderRadius="16px"
                onClick={handleZalo}
                fontSize="15px"
                fontWeight="bold"
                bg="white"
                _dark={{ bg: 'gray.800', borderColor: 'green.700' }}
                borderWidth="1.5px"
                borderColor="green.200"
              >
                <Icon as={MessageCircle} mr={2} boxSize={4} strokeWidth={2.5} />
                {t('zalo')}
              </Button>
            )}
          </VStack>
        )}

        {/* Footer */}
        <Button
          width="full"
          height="44px"
          variant="ghost"
          colorPalette="green"
          borderRadius="16px"
          fontSize="14px"
          fontWeight="bold"
          color="green.600"
          _dark={{ color: 'green.400' }}
          _hover={{ bg: 'transparent', opacity: 0.75 }}
          onClick={() => {
            if (onClose) onClose();
            router.push(`/user/${userId}`);
          }}
        >
          {tSession('viewDetails') || 'Xem chi tiết'}
          <Icon as={ChevronRight} ml={1} boxSize={4} />
        </Button>
      </VStack>

      {/* Avatar full-size preview */}
      {isAvatarPreviewOpen && image && (
        <Portal>
          <Flex
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.800"
            zIndex={2000}
            align="center"
            justify="center"
            p={4}
            onClick={(e) => {
              e.stopPropagation();
              setIsAvatarPreviewOpen(false);
            }}
            animation="fadeIn 0.15s ease-out"
            css={{
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Box
              as="button"
              {...({ type: 'button' } as Record<string, unknown>)}
              position="absolute"
              top={4}
              right={4}
              w={10}
              h={10}
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              bg="whiteAlpha.200"
              color="white"
              _hover={{ bg: 'whiteAlpha.300' }}
              transition="background 0.2s"
              aria-label="Close image preview"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsAvatarPreviewOpen(false);
              }}
            >
              <Icon as={X} boxSize={5} />
            </Box>
            <Image
              src={getFullSizeAvatarUrl(image)}
              alt={name || 'Host'}
              w={{ base: '92vw', md: '560px' }}
              maxW="92vw"
              maxH="90vh"
              borderRadius="16px"
              objectFit="contain"
              boxShadow="0 4px 16px rgba(0,0,0,.08)"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
          </Flex>
        </Portal>
      )}
    </Box>
  );
};

export default AppHostDetail;
