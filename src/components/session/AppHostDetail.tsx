'use client';

import { UserRatingSummaryCard } from '@/components/rating/UserRatingSummaryCard';
import { Button, HStack, VStack, Image } from '@/components/ui/chakra-compat';
import { RatingService } from '@/lib/api/rating.service';
import { SessionService } from '@/lib/api/session.service';
import { UserRatingStats } from '@/lib/api/types';
import {
  Avatar,
  Box,
  Flex,
  Grid,
  Icon,
  Separator,
  Text,
} from '@chakra-ui/react';
import { Check, Copy, Phone, ChevronRight } from 'lucide-react';
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

  return (
    <Box w="full">
      <VStack gap={0} align="stretch">
        {/* Profile Header — gradient banner */}
        <Box
          mx={-4}
          mt={-4}
          mb={0}
          px={4}
          pt={6}
          pb={5}
          style={{
            background:
              'linear-gradient(135deg, #16a34a 0%, #15803d 60%, #14532d 100%)',
          }}
        >
          <Flex direction="column" align="center" gap={3}>
            <Avatar.Root
              size="xl"
              borderWidth="3px"
              borderColor="white"
              boxShadow="0 4px 16px rgba(0,0,0,0.2)"
            >
              <Avatar.Fallback
                name={name || 'Host'}
                bg="green.300"
                color="white"
                fontSize="2xl"
                fontWeight="bold"
              >
                {(name || 'H').charAt(0).toUpperCase()}
              </Avatar.Fallback>
              {image && <Avatar.Image src={image} />}
            </Avatar.Root>

            <Box textAlign="center">
              <Text
                fontSize="xl"
                fontWeight="extrabold"
                color="white"
                letterSpacing="tight"
                lineHeight="1.2"
              >
                {name || 'Unknown Host'}
              </Text>
              {phone && (
                <Flex
                  align="center"
                  justify="center"
                  gap={1.5}
                  mt={1}
                  onClick={handleCopyPhone}
                  cursor="pointer"
                  role="button"
                  _hover={{ opacity: 0.8 }}
                  transition="opacity 0.2s"
                >
                  <Icon as={Phone} boxSize={3.5} color="green.200" />
                  <Text fontSize="sm" fontWeight="semibold" color="green.100">
                    {phone}
                  </Text>
                  <Icon
                    as={copied ? Check : Copy}
                    boxSize={3.5}
                    color={copied ? 'yellow.300' : 'green.200'}
                    transition="color 0.2s"
                  />
                </Flex>
              )}
            </Box>
          </Flex>
        </Box>

        {/* Stats */}
        {!loading && (
          <Grid templateColumns="1fr 1fr" gap={0} mt={0}>
            <Box
              py={4}
              px={3}
              textAlign="center"
              borderBottomWidth="1px"
              borderRightWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
            >
              <Text
                fontSize="2xl"
                fontWeight="extrabold"
                color="gray.700"
                _dark={{ color: 'gray.100' }}
                lineHeight="1"
              >
                {totalSessions}
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1} fontWeight="medium">
                {t('totalHosted')}
              </Text>
            </Box>
            <Box
              py={4}
              px={3}
              textAlign="center"
              borderBottomWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
            >
              <Text
                fontSize="2xl"
                fontWeight="extrabold"
                color="green.600"
                _dark={{ color: 'green.400' }}
                lineHeight="1"
              >
                {availableSessions}
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1} fontWeight="medium">
                {t('availableSessions')}
              </Text>
            </Box>
          </Grid>
        )}

        {/* Rating Section */}
        <Box pt={4} pb={2}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="widest"
            mb={3}
          >
            {t('rating')}
          </Text>
          <UserRatingSummaryCard
            stats={stats}
            isLoading={loading}
            showBreakdown
          />
        </Box>

        <Separator />

        {/* Contact Actions */}
        {phone && (
          <HStack gap={3} pt={4}>
            <Button
              colorPalette="green"
              variant="solid"
              flex={1}
              height="48px"
              borderRadius="xl"
              onClick={handleCall}
              fontSize="sm"
              fontWeight="bold"
              boxShadow="0 2px 10px rgba(22, 163, 74, 0.25)"
            >
              <Icon as={Phone} mr={2} boxSize={4} strokeWidth={2.5} />
              {t('call')}
            </Button>
            {allowZaloContact && (
              <Button
                colorPalette="green"
                variant="subtle"
                flex={1}
                height="48px"
                borderRadius="xl"
                onClick={handleZalo}
                fontSize="sm"
                fontWeight="bold"
                borderWidth="1.5px"
                borderColor="green.200"
                _dark={{ borderColor: 'green.800' }}
              >
                {t('zalo')}
              </Button>
            )}
          </HStack>
        )}

        <Button
          mt={4}
          width="full"
          height="46px"
          variant="subtle"
          colorPalette="green"
          borderRadius="xl"
          fontSize="sm"
          fontWeight="bold"
          borderWidth="1px"
          borderColor="green.100"
          _dark={{ borderColor: 'green.900' }}
          onClick={() => {
            if (onClose) onClose();
            router.push(`/user/${userId}`);
          }}
        >
          {tSession('viewDetails') || 'Xem chi tiết'}
          <Icon as={ChevronRight} ml={1} boxSize={4} opacity={0.8} />
        </Button>
      </VStack>
    </Box>
  );
};

export default AppHostDetail;
