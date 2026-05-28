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

export default function PublicUserProfileSkeleton() {
  const t = useTranslations('userProfilePage');

  return (
    <PageLayout
      title={t('title')}
      showBackButton={true}
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
          <Skeleton height="112px" borderRadius="0" />
          <Box px={5} pb={5}>
            <HStack align="start" gap={4} mt="-10">
              <SkeletonCircle size="80px" />
              <VStack align="start" gap={3} flex={1} pt={12}>
                <HStack gap={2}>
                  <Skeleton height="16px" width="100px" borderRadius="full" />
                  <Skeleton height="20px" width="80px" borderRadius="full" />
                </HStack>
                <SimpleGrid columns={2} gap={3} width="full">
                  <Skeleton height="52px" borderRadius="lg" />
                  <Skeleton height="52px" borderRadius="lg" />
                </SimpleGrid>
                <Skeleton height="16px" width="120px" borderRadius="sm" />
                <Skeleton height="16px" width="150px" borderRadius="sm" />
                <Skeleton height="16px" width="130px" borderRadius="sm" />
              </VStack>
            </HStack>
          </Box>
        </Box>

        {/* Clubs card */}
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          p={4}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Skeleton height="24px" width="80px" mb={4} borderRadius="md" />
          <VStack gap={2} align="stretch">
            {[0, 1].map((i) => (
              <HStack
                key={i}
                gap={3}
                p={3}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                _dark={{ borderColor: 'gray.700' }}
              >
                <Skeleton boxSize="40px" borderRadius="md" />
                <VStack align="start" gap={1} flex={1}>
                  <Skeleton height="16px" width="60%" borderRadius="sm" />
                  <Skeleton height="12px" width="40%" borderRadius="sm" />
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Sessions card */}
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          p={4}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Skeleton height="24px" width="160px" mb={4} borderRadius="md" />
          <HStack gap={2} mb={4}>
            <Skeleton height="32px" width="100px" borderRadius="full" />
            <Skeleton height="32px" width="100px" borderRadius="full" />
            <Skeleton height="32px" width="80px" borderRadius="full" />
          </HStack>
          <VStack gap={3} align="stretch">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="80px" borderRadius="lg" />
            ))}
          </VStack>
        </Box>

        {/* Reviews card */}
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          p={4}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <Skeleton height="24px" width="100px" mb={4} borderRadius="md" />
          <Skeleton height="80px" borderRadius="lg" mb={3} />
          <VStack gap={3} align="stretch">
            {[0, 1].map((i) => (
              <HStack key={i} gap={3} align="start">
                <SkeletonCircle size="36px" />
                <VStack align="start" gap={2} flex={1}>
                  <Skeleton height="14px" width="40%" borderRadius="sm" />
                  <Skeleton height="14px" width="80%" borderRadius="sm" />
                  <Skeleton height="14px" width="60%" borderRadius="sm" />
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>
    </PageLayout>
  );
}
