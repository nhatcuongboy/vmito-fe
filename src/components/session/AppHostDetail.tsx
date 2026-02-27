'use client';

import { UserRatingSummaryCard } from '@/components/rating/UserRatingSummaryCard';
import { Button, HStack, VStack } from '@/components/ui/chakra-compat';
import { RatingService } from '@/lib/api/rating.service';
import { SessionService } from '@/lib/api/session.service';
import { UserRatingStats } from '@/lib/api/types';
import { Avatar, Box, Grid, Icon, Image, Text } from '@chakra-ui/react';
import { Check, Copy, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface AppHostDetailProps {
  userId: string;
  name?: string;
  image?: string;
  phone?: string;
  email?: string;
  hideHeader?: boolean;
}

export const AppHostDetail = ({
  userId,
  name,
  image,
  phone,
  hideHeader = false,
}: AppHostDetailProps) => {
  const t = useTranslations('session.hostDetail');
  const [stats, setStats] = useState<UserRatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [availableSessions, setAvailableSessions] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [ratingData, availableData] = await Promise.all([
          RatingService.getUserRatingStats(userId),
          SessionService.getAvailableSessions({ hostId: userId, limit: 1 }),
        ]);
        setStats(ratingData);
        setTotalSessions(ratingData.asHostCount ?? 0);
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
      <VStack gap={4} align="stretch">
        {/* Profile Header */}
        <HStack gap={4} align="center">
          <Avatar.Root
            size="xl"
            bg="brand.500"
            borderWidth="3px"
            borderColor="white"
            boxShadow="0 4px 12px rgba(0,0,0,0.1)"
            flexShrink={0}
          >
            <Avatar.Fallback name={name || 'Host'}>
              {(name || 'H').charAt(0).toUpperCase()}
            </Avatar.Fallback>
            {image && <Avatar.Image src={image} />}
          </Avatar.Root>
          <Box flex={1} minW={0}>
            <Text
              fontSize="xl"
              fontWeight="extrabold"
              color="gray.800"
              _dark={{ color: 'white' }}
              letterSpacing="tight"
              truncate
            >
              {name || 'Unknown Host'}
            </Text>
            {phone && (
              <HStack gap={1} color="gray.500" mt={1} align="center">
                <Icon
                  as={Phone}
                  boxSize={3.5}
                  color="brand.500"
                  flexShrink={0}
                />
                <Text fontSize="sm" fontWeight="medium" flex={1}>
                  {phone}
                </Text>
                <Box
                  as="button"
                  onClick={handleCopyPhone}
                  p={1}
                  borderRadius="md"
                  color={copied ? 'green.500' : 'gray.400'}
                  _hover={{ color: 'gray.600', bg: 'gray.100' }}
                  transition="all 0.2s"
                  flexShrink={0}
                  aria-label="Copy phone"
                >
                  <Icon as={copied ? Check : Copy} boxSize={3.5} />
                </Box>
              </HStack>
            )}
          </Box>
        </HStack>

        {/* Session Stats */}
        {!loading && (
          <Grid templateColumns="1fr 1fr" gap={2.5}>
            <Box
              bg="gray.50"
              _dark={{ bg: 'gray.800' }}
              borderRadius="lg"
              p={2.5}
              textAlign="center"
            >
              <Text fontSize="xl" fontWeight="extrabold" color="brand.500">
                {totalSessions}
              </Text>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">
                {t('totalHosted')}
              </Text>
            </Box>
            <Box
              bg="green.50"
              _dark={{ bg: 'green.900' }}
              borderRadius="lg"
              p={2.5}
              textAlign="center"
            >
              <Text fontSize="xl" fontWeight="extrabold" color="green.500">
                {availableSessions}
              </Text>
              <Text fontSize="xs" color="gray.500" fontWeight="medium">
                {t('availableSessions')}
              </Text>
            </Box>
          </Grid>
        )}

        {/* Rating Section */}
        <Box>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="widest"
            mb={2}
            px={1}
          >
            {t('rating')}
          </Text>
          <UserRatingSummaryCard
            stats={stats}
            isLoading={loading}
            showBreakdown
          />
        </Box>

        {/* Contact Actions */}
        {phone && (
          <HStack gap={2.5}>
            <Button
              colorPalette="green"
              variant="solid"
              flex={1}
              height="48px"
              borderRadius="xl"
              onClick={handleCall}
              fontSize="sm"
              fontWeight="bold"
              boxShadow="0 4px 12px rgba(16, 185, 129, 0.25)"
              _hover={{ bg: 'green.600' }}
            >
              <Icon as={Phone} mr={1.5} boxSize={4} strokeWidth={2.5} />
              {t('call')}
            </Button>
            <Button
              colorPalette="blue"
              variant="outline"
              flex={1}
              height="48px"
              borderRadius="xl"
              onClick={handleZalo}
              fontSize="sm"
              fontWeight="bold"
              _hover={{ bg: 'blue.50' }}
            >
              <Image
                src="/icons/zalo.png"
                alt="Zalo"
                boxSize={5}
                mr={1.5}
                flexShrink={0}
              />
              {t('zalo')}
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default AppHostDetail;
