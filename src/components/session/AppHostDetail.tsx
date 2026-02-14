'use client';

import { Box, Flex, Text, Avatar, Icon } from '@chakra-ui/react';
import { Phone, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { RatingService } from '@/lib/api/rating.service';
import { UserRatingStats } from '@/lib/api/types';
import { UserRatingSummaryCard } from '@/components/rating/UserRatingSummaryCard';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  VStack,
  HStack,
} from '@/components/ui/chakra-compat';

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
  email,
  hideHeader = false,
}: AppHostDetailProps) => {
  const t = useTranslations('session.hostDetail');
  const [stats, setStats] = useState<UserRatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await RatingService.getUserRatingStats(userId);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch host rating stats:', error);
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

  return (
    <Card
      w="full"
      maxW="400px"
      borderWidth={hideHeader ? '0' : '1px'}
      boxShadow={hideHeader ? 'none' : 'sm'}
    >
      {!hideHeader && (
        <CardHeader>
          <Text fontSize="lg" fontWeight="bold">
            {t('title')}
          </Text>
        </CardHeader>
      )}
      <CardBody>
        <VStack gap={4} align="stretch">
          <Flex align="center" gap={4}>
            <Avatar.Root size="xl" bg="brand.500">
              <Avatar.Fallback name={name || 'Host'}>
                {(name || 'H').charAt(0).toUpperCase()}
              </Avatar.Fallback>
              {image && <Avatar.Image src={image} />}
            </Avatar.Root>
            <Box flex={1}>
              <Text fontSize="xl" fontWeight="bold">
                {name || 'Unknown Host'}
              </Text>
              {email && (
                <HStack gap={1} color="gray.500">
                  <Icon as={Mail} boxSize={3} />
                  <Text fontSize="xs">{email}</Text>
                </HStack>
              )}
            </Box>
          </Flex>

          <Box>
            <Text
              fontSize="sm"
              fontWeight="medium"
              mb={2}
              color="gray.600"
              _dark={{ color: 'gray.400' }}
            >
              {t('rating')}
            </Text>
            <UserRatingSummaryCard
              stats={stats}
              isLoading={loading}
              showBreakdown
            />
          </Box>

          {phone && (
            <Button
              colorPalette="green"
              variant="outline"
              w="full"
              onClick={handleCall}
              leftIcon={<Icon as={Phone} />}
            >
              {t('call')} ({phone})
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default AppHostDetail;
