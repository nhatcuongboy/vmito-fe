'use client';

import {
  Box,
  Flex,
  Grid,
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  Stack,
  VStack,
} from '@chakra-ui/react';
import { Card, CardBody, CardHeader } from '@/components/ui/chakra-compat';

const PLAYER_CARD_COUNT = 12;
const COURT_CARD_COUNT = 4;
const WAITING_PLAYER_COUNT = 4;
const OVERVIEW_STAT_COUNT = 4;

function OverviewPanelSkeleton({ minH = '240px' }: { minH?: string }) {
  return (
    <Box
      p={6}
      bg={{ base: 'white', _dark: 'gray.800' }}
      _dark={{ borderColor: 'gray.700' }}
      borderRadius="xl"
      shadow="sm"
      border="1px solid"
      borderColor="gray.100"
      minH={minH}
    >
      <Flex align="center" justify="space-between" mb={5} gap={3}>
        <Skeleton height="18px" width="140px" borderRadius="md" />
        <Skeleton height="28px" width="68px" borderRadius="md" />
      </Flex>

      <VStack gap={4} align="stretch">
        {Array.from({ length: 5 }).map((_, index) => (
          <Flex key={index} align="center" gap={3}>
            <SkeletonCircle size="8" />
            <Box flex={1}>
              <Skeleton height="16px" width="42%" mb={2} borderRadius="md" />
              <Skeleton height="14px" width="70%" borderRadius="md" />
            </Box>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}

function PlayerCardSkeleton() {
  return (
    <Box
      borderWidth="2px"
      borderColor="gray.200"
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius="lg"
      boxShadow={{ base: '0 6px 16px rgba(15, 23, 42, 0.14)', _dark: 'md' }}
      px={2}
      py={2}
      minH="132px"
    >
      <VStack gap={2} align="stretch">
        <Flex justify="space-between" align="center">
          <Skeleton height="20px" width="44px" borderRadius="md" />
          <Skeleton height="22px" width="22px" borderRadius="full" />
        </Flex>
        <Skeleton height="18px" width="85%" borderRadius="md" />
        <Skeleton height="16px" width="56%" borderRadius="md" />
        <Flex gap={1.5} wrap="wrap">
          <Skeleton height="22px" width="46px" borderRadius="full" />
          <Skeleton height="22px" width="58px" borderRadius="full" />
        </Flex>
      </VStack>
    </Box>
  );
}

function CourtCardSkeleton() {
  return (
    <Card variant="outline" boxShadow="md">
      <CardHeader
        bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
        p={4}
        boxShadow="md"
      >
        <Flex justify="space-between" align="center" gap={3}>
          <HStack gap={3} minW={0}>
            <SkeletonCircle size="8" />
            <Skeleton height="24px" width="120px" borderRadius="md" />
          </HStack>
          <HStack gap={2}>
            <Skeleton height="20px" width="54px" borderRadius="md" />
            <Skeleton height="20px" width="64px" borderRadius="md" />
          </HStack>
        </Flex>
      </CardHeader>
      <CardBody pt={0} pb={0} px={0}>
        <VStack gap={4} pb={4} align="stretch" minH="260px">
          <Box p={4}>
            <Skeleton
              height={{ base: '180px', md: '220px' }}
              borderRadius="lg"
            />
          </Box>
          <HStack justify="center" gap={2} px={4}>
            <Skeleton height="32px" width="118px" borderRadius="md" />
            <Skeleton height="32px" width="92px" borderRadius="md" />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
}

export function SessionOverviewTabSkeleton() {
  return (
    <Box>
      <Grid
        templateColumns={{ base: '1fr', md: '3fr 2fr' }}
        gap={{ base: 4, md: 8 }}
        mb={{ base: 4, md: 8 }}
      >
        <OverviewPanelSkeleton minH="360px" />

        <Box
          p={6}
          bg={{ base: 'white', _dark: 'gray.800' }}
          _dark={{ borderColor: 'gray.700' }}
          borderRadius="xl"
          shadow="sm"
          border="1px solid"
          borderColor="gray.100"
          minH="360px"
        >
          <Skeleton height="18px" width="150px" mb={5} borderRadius="md" />
          <Flex justify="center" align="center" py={4}>
            <Skeleton height="140px" width="140px" borderRadius="lg" />
          </Flex>
          <VStack gap={4} align="stretch" mt={5}>
            <Skeleton height="62px" width="100%" borderRadius="xl" />
            <Skeleton height="38px" width="100%" borderRadius="lg" />
            <Skeleton height="84px" width="100%" borderRadius="xl" />
          </VStack>
        </Box>
      </Grid>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        {Array.from({ length: OVERVIEW_STAT_COUNT }).map((_, index) => (
          <Box
            key={index}
            p={4}
            bg={{ base: 'white', _dark: 'gray.800' }}
            borderRadius="xl"
            shadow="sm"
            border="1px solid"
            borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
          >
            <Flex align="center" mb={3} gap={3}>
              <SkeletonCircle size="9" />
              <Skeleton height="16px" width="76px" borderRadius="md" />
            </Flex>
            <Skeleton height="30px" width="54px" mb={3} borderRadius="md" />
            <Skeleton height="4px" width="100%" borderRadius="full" />
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export function SessionPlayersTabSkeleton() {
  return (
    <VStack gap={3} align="stretch">
      <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
        <Skeleton height="28px" width="180px" borderRadius="md" />
        <Skeleton height="32px" width="126px" borderRadius="md" />
      </Flex>

      <Box py={2} mx="-4">
        <Skeleton height="44px" width="100%" borderRadius="xl" />
      </Box>

      <Flex justify="space-between" align="center" gap={3}>
        <HStack gap={2} flexWrap="wrap">
          <Skeleton height="34px" width="72px" borderRadius="full" />
          <Skeleton height="34px" width="82px" borderRadius="full" />
          <Skeleton height="34px" width="76px" borderRadius="full" />
        </HStack>
        <Skeleton height="40px" width="86px" borderRadius="lg" />
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} gap={{ base: 3, md: 4 }}>
        {Array.from({ length: PLAYER_CARD_COUNT }).map((_, index) => (
          <PlayerCardSkeleton key={index} />
        ))}
      </SimpleGrid>
    </VStack>
  );
}

export function SessionCourtsTabSkeleton() {
  return (
    <Stack gap={6}>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mt={4} p={1}>
        {Array.from({ length: COURT_CARD_COUNT }).map((_, index) => (
          <CourtCardSkeleton key={index} />
        ))}
      </SimpleGrid>

      <Box
        borderWidth="1px"
        borderColor="gray.200"
        _dark={{ borderColor: 'gray.700' }}
        borderRadius="lg"
        p={4}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Skeleton height="24px" width="160px" borderRadius="md" />
          <Skeleton height="24px" width="64px" borderRadius="full" />
        </Flex>
        <VStack gap={3} align="stretch">
          {Array.from({ length: WAITING_PLAYER_COUNT }).map((_, index) => (
            <Flex key={index} align="center" gap={3}>
              <SkeletonCircle size="9" />
              <Box flex={1}>
                <Skeleton height="16px" width="55%" mb={2} borderRadius="md" />
                <Skeleton height="14px" width="38%" borderRadius="md" />
              </Box>
              <Skeleton height="24px" width="68px" borderRadius="full" />
            </Flex>
          ))}
        </VStack>
      </Box>
    </Stack>
  );
}
