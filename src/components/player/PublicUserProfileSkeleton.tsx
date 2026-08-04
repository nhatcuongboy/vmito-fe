'use client';

import {
  Box,
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  VStack,
} from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import PageLayout from '@/components/layout/PageLayout';
import { NewsfeedSkeleton } from '@/components/post/PostCardSkeleton';
import { DETAIL_PAGE_MAX_W } from '@/constants';

export default function PublicUserProfileSkeleton() {
  const t = useTranslations('userProfilePage');

  return (
    <PageLayout
      title={t('title')}
      maxW={DETAIL_PAGE_MAX_W}
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <VStack gap={6} align="stretch" pb={6}>
        {/* Profile header card */}
        <Box
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          bg="white"
          overflow="hidden"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          {/* Cover photo */}
          <Skeleton height={{ base: '180px', md: '220px' }} borderRadius="0" />

          {/* Centered avatar overlapping the cover */}
          <VStack gap={0} align="center" px={5}>
            <Box mt="-48px">
              <SkeletonCircle
                size="112px"
                borderWidth="4px"
                borderColor="white"
                _dark={{ borderColor: 'gray.800' }}
              />
            </Box>
            <Skeleton height="22px" width="140px" borderRadius="md" mt={3} />
            <Skeleton height="14px" width="100px" borderRadius="md" mt={2} />
            <Skeleton height="28px" width="96px" borderRadius="full" mt={3} />
          </VStack>

          {/* Info section: two columns */}
          <Box px={5} pb={5} pt={4}>
            <SimpleGrid columns={2} gap={8} width="full">
              <VStack align="stretch" gap={2.5}>
                <Skeleton height="14px" width="80%" borderRadius="md" />
                <Skeleton height="14px" width="70%" borderRadius="md" />
                <Skeleton height="14px" width="90%" borderRadius="md" />
              </VStack>
              <VStack align="stretch" gap={2.5}>
                <Skeleton height="14px" width="80%" borderRadius="md" />
                <Skeleton height="14px" width="70%" borderRadius="md" />
              </VStack>
            </SimpleGrid>
          </Box>
        </Box>

        {/* Section tabs */}
        <HStack
          gap={2}
          borderBottomWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700' }}
          pb={3}
        >
          {[72, 96, 64, 80].map((w, i) => (
            <Skeleton
              key={i}
              height="20px"
              width={`${w}px`}
              borderRadius="md"
            />
          ))}
        </HStack>

        {/* Default active tab content (posts) */}
        <NewsfeedSkeleton count={2} />
      </VStack>
    </PageLayout>
  );
}
