'use client';

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
  Skeleton,
  Text,
} from '@chakra-ui/react';
import { Phone, ChevronRight, Star, MessageCircle, X } from 'lucide-react';
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
          p={6}
        >
          <Flex align="center" justify="space-between" gap={4} mb={5}>
            <HStack gap={2}>
              <Icon as={Star} boxSize={5} color="#FBBF24" fill="#FBBF24" />
              <Text
                fontSize="20px"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'gray.100' }}
                lineHeight="1.2"
              >
                {t('rating')}
              </Text>
            </HStack>

            {hasRating && stats && stats.averageRating >= 4.5 && (
              <Box
                px={4}
                py={1.5}
                borderRadius="999px"
                bg="green.50"
                _dark={{ bg: 'green.900' }}
              >
                <Text
                  fontSize="13px"
                  fontWeight="bold"
                  color="green.600"
                  _dark={{ color: 'green.300' }}
                  whiteSpace="nowrap"
                >
                  Host uy tín
                </Text>
              </Box>
            )}
          </Flex>

          {loading ? (
            <VStack gap={4} align="center" py={3}>
              <Skeleton height="40px" width="88px" borderRadius="md" />
              <Skeleton height="20px" width="140px" borderRadius="md" />
              <Skeleton height="16px" width="180px" borderRadius="md" />
            </VStack>
          ) : hasRating && stats ? (
            <VStack gap={3} align="center">
              <Text
                fontSize={{ base: '40px', md: '38px' }}
                fontWeight="bold"
                color="gray.900"
                _dark={{ color: 'gray.50' }}
                lineHeight="1"
                textAlign="center"
              >
                {displayRating.toFixed(1)}
              </Text>

              <HStack gap={1} justify="center" aria-label={t('rating')}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    as={Star}
                    boxSize={5}
                    fill={
                      star <= Math.round(stats.averageRating)
                        ? '#FBBF24'
                        : '#E5E7EB'
                    }
                    color={
                      star <= Math.round(stats.averageRating)
                        ? '#FBBF24'
                        : '#E5E7EB'
                    }
                  />
                ))}
              </HStack>

              <Text
                fontSize="14px"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                textAlign="center"
              >
                Dựa trên {stats.totalRatings} đánh giá
              </Text>
            </VStack>
          ) : (
            <VStack gap={3} align="center" py={2}>
              <Flex
                w={12}
                h={12}
                align="center"
                justify="center"
                borderRadius="full"
                bg="gray.50"
                color="gray.300"
                _dark={{ bg: 'gray.700', color: 'gray.500' }}
              >
                <Icon as={Star} boxSize={6} />
              </Flex>

              <Text
                fontSize="18px"
                fontWeight="bold"
                color="gray.800"
                _dark={{ color: 'gray.100' }}
                textAlign="center"
                lineHeight="1.3"
              >
                Chưa có đánh giá
              </Text>

              <Text
                fontSize="14px"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
                textAlign="center"
                lineHeight="1.5"
              >
                Host này chưa nhận đánh giá nào.
              </Text>
            </VStack>
          )}
        </Box>

        {/* Action Buttons */}
        {phone && (
          <Flex direction="row" gap="12px" align="stretch">
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
              flex={1}
              minW={0}
            >
              <Icon as={Phone} mr={2} boxSize={4} strokeWidth={2.5} />
              {t('call')}
            </Button>
            {allowZaloContact && (
              <Button
                variant="solid"
                width="full"
                height="52px"
                borderRadius="16px"
                onClick={handleZalo}
                fontSize="15px"
                fontWeight="bold"
                bg="#0068FF"
                color="white"
                _hover={{ bg: '#0057D1' }}
                _active={{ bg: '#0050C0' }}
                flex={1}
                minW={0}
              >
                <Icon as={MessageCircle} mr={2} boxSize={4} strokeWidth={2.5} />
                {t('zalo')}
              </Button>
            )}
          </Flex>
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
              position="relative"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                as="button"
                {...({ type: 'button' } as Record<string, unknown>)}
                position="absolute"
                top="-12px"
                right="-12px"
                w={12}
                h={12}
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="full"
                bg="blackAlpha.800"
                color="white"
                borderWidth="2px"
                borderColor="whiteAlpha.800"
                boxShadow="0 8px 24px rgba(0,0,0,.24)"
                _hover={{ bg: 'blackAlpha.900' }}
                _active={{ bg: 'blackAlpha.950' }}
                transition="background 0.2s"
                aria-label="Close image preview"
                zIndex={1}
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
            </Box>
          </Flex>
        </Portal>
      )}
    </Box>
  );
};

export default AppHostDetail;
