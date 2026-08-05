'use client';

import type { ReactNode } from 'react';
import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  VStack,
} from '@chakra-ui/react';

const repeat = (count: number) => Array.from({ length: count });

/** Mirrors TournamentCard's layout so switching to real data doesn't shift it. */
export function TournamentCardSkeleton() {
  return (
    <Box
      bg="bg"
      borderRadius="xl"
      overflow="hidden"
      borderWidth="1px"
      borderColor="border.subtle"
      display="flex"
      flexDirection={{ base: 'row', md: 'column' }}
    >
      <Box
        flexShrink={0}
        w={{ base: '120px', md: 'auto' }}
        aspectRatio={{ base: 'auto', md: 16 / 9 }}
      >
        <Skeleton height="100%" width="100%" />
      </Box>
      <VStack
        align="stretch"
        gap={{ base: 1, md: 1.5 }}
        p={{ base: 2.5, md: 3 }}
        flex="1"
      >
        <Skeleton height="14px" width="55%" borderRadius="md" />
        <Skeleton height="18px" width="90%" borderRadius="md" />
        <Skeleton height="18px" width="65%" borderRadius="md" />
        <Skeleton height="14px" width="75%" borderRadius="md" />
        <HStack gap={1.5} pt={1} mt="auto">
          <Skeleton height="18px" width="64px" borderRadius="full" />
          <Skeleton height="18px" width="72px" borderRadius="full" />
        </HStack>
      </VStack>
    </Box>
  );
}

export function TournamentCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SimpleGrid
      columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
      gap={{ base: 3, md: 5 }}
    >
      {repeat(count).map((_, index) => (
        <TournamentCardSkeleton key={index} />
      ))}
    </SimpleGrid>
  );
}

export function HostTournamentRowSkeleton() {
  return (
    <Flex
      p={4}
      align="center"
      gap={4}
      bg="white"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderWidth="1px"
      borderColor="gray.100"
      boxShadow="sm"
      borderRadius="xl"
    >
      <Skeleton height="56px" width="56px" borderRadius="lg" flexShrink={0} />
      <Box flex={1} minW={0}>
        <Skeleton height="18px" width="64%" mb={2} borderRadius="md" />
        <Skeleton height="14px" width="42%" borderRadius="md" />
      </Box>
      <Skeleton height="22px" width="86px" borderRadius="full" />
      <Box minW="50px" display={{ base: 'none', sm: 'block' }}>
        <Skeleton
          height="18px"
          width="32px"
          mx="auto"
          mb={1}
          borderRadius="md"
        />
        <Skeleton height="10px" width="64px" borderRadius="md" />
      </Box>
      <Skeleton height="32px" width="32px" borderRadius="md" />
      <Skeleton height="32px" width="32px" borderRadius="md" />
    </Flex>
  );
}

export function HostTournamentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
      {repeat(count).map((_, index) => (
        <HostTournamentRowSkeleton key={index} />
      ))}
    </SimpleGrid>
  );
}

export function TournamentTableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="white"
      overflow="hidden"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <HStack gap={3} p={4} bg="gray.50" _dark={{ bg: 'gray.900' }}>
        {repeat(columns).map((_, index) => (
          <Skeleton
            key={index}
            height="14px"
            width={index === 0 ? '28%' : '12%'}
            borderRadius="md"
          />
        ))}
      </HStack>
      <VStack align="stretch" gap={0}>
        {repeat(rows).map((_, rowIndex) => (
          <HStack
            key={rowIndex}
            gap={3}
            p={4}
            borderTopWidth="1px"
            borderColor="gray.100"
            _dark={{ borderColor: 'gray.700' }}
          >
            {repeat(columns).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                height="16px"
                width={columnIndex === 0 ? '30%' : '12%'}
                borderRadius="md"
              />
            ))}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

export function TournamentMatchListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <VStack align="stretch" gap={3}>
      {repeat(count).map((_, index) => (
        <Box
          key={index}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          bg="white"
          p={4}
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <HStack gap={2}>
                <Skeleton height="22px" width="84px" borderRadius="full" />
                <Skeleton height="16px" width="80px" borderRadius="md" />
              </HStack>
              <Skeleton height="18px" width="64px" borderRadius="md" />
            </HStack>
            <HStack gap={3}>
              <SkeletonCircle size="7" />
              <Skeleton height="18px" width="35%" borderRadius="md" />
              <Skeleton height="14px" width="28px" borderRadius="md" />
              <Skeleton height="18px" width="35%" borderRadius="md" />
            </HStack>
          </VStack>
        </Box>
      ))}
    </VStack>
  );
}

export function TournamentTeamsSkeleton() {
  return (
    <VStack align="stretch" gap={5}>
      <Flex justify="space-between" align="center" gap={4}>
        <Skeleton height="30px" width="160px" borderRadius="md" />
        <Skeleton height="32px" width="132px" borderRadius="full" />
      </Flex>
      {repeat(3).map((_, categoryIndex) => (
        <Box
          key={categoryIndex}
          borderWidth="1px"
          borderColor="gray.200"
          borderTopWidth="3px"
          borderTopColor="gray.300"
          borderRadius="2xl"
          px={4}
          py={4}
          bg="white"
          _dark={{
            bg: 'gray.800',
            borderColor: 'gray.700',
            borderTopColor: 'gray.600',
          }}
        >
          <VStack align="stretch" gap={3}>
            <Skeleton height="22px" width="40%" borderRadius="md" />
            {repeat(4).map((__, playerIndex) => (
              <Flex key={playerIndex} align="center" gap={3} px={2} py={1.5}>
                <SkeletonCircle size="6" />
                <Skeleton height="20px" flex={1} borderRadius="md" />
                <Skeleton height="12px" width="64px" borderRadius="md" />
              </Flex>
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  );
}

export function TournamentManageSkeleton() {
  return (
    <VStack align="stretch" gap={4}>
      <Flex justify="space-between" align="center">
        <Skeleton height="34px" width="220px" borderRadius="md" />
      </Flex>
      <HStack
        bg="gray.100"
        borderRadius="full"
        p={1}
        w="fit-content"
        _dark={{ bg: 'gray.800' }}
      >
        <Skeleton height="32px" width="104px" borderRadius="full" />
        <Skeleton height="32px" width="96px" borderRadius="full" />
      </HStack>
      <Flex gap={6} align="flex-start">
        <Box flex={{ md: '0 1 42%', xl: '0 1 38%' }} minW={0}>
          <VStack align="stretch" gap={3}>
            {repeat(8).map((_, index) => (
              <Flex
                key={index}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
                bg="white"
                p={4}
                gap={3}
                align="center"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
              >
                <Skeleton height="40px" width="40px" borderRadius="lg" />
                <Box flex={1}>
                  <Skeleton
                    height="17px"
                    width="54%"
                    mb={2}
                    borderRadius="md"
                  />
                  <Skeleton height="13px" width="80%" borderRadius="md" />
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>
        <Box
          display={{ base: 'none', md: 'block' }}
          flex={{ md: '0 0 58%', xl: '0 0 62%' }}
          minW={0}
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p={5}
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        >
          <VStack align="stretch" gap={4}>
            <Skeleton height="28px" width="45%" borderRadius="md" />
            <Skeleton height="16px" width="75%" borderRadius="md" />
            <TournamentTableSkeleton rows={4} columns={4} />
          </VStack>
        </Box>
      </Flex>
    </VStack>
  );
}

export function TournamentContentSkeleton() {
  return (
    <VStack align="stretch" gap={5}>
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="2xl"
        bg="white"
        overflow="hidden"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      >
        <Skeleton height={{ base: '150px', md: '180px' }} />
        <Box p={{ base: 4, md: 5 }}>
          <Skeleton
            height={{ base: '26px', md: '30px' }}
            width={{ base: '72%', md: '45%' }}
            mb={3}
            borderRadius="md"
          />
          <Skeleton
            height={{ base: '15px', md: '16px' }}
            width={{ base: '90%', md: '70%' }}
            mb={2}
            borderRadius="md"
          />
          <Skeleton
            height={{ base: '15px', md: '16px' }}
            width={{ base: '58%', md: '52%' }}
            borderRadius="md"
          />
        </Box>
      </Box>
      <SimpleGrid
        display={{ base: 'none', md: 'grid' }}
        columns={{ md: 2, xl: 3 }}
        gap={4}
      >
        {repeat(3).map((_, index) => (
          <Box
            key={index}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            bg="white"
            p={4}
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            <Skeleton height="18px" width="60%" mb={3} borderRadius="md" />
            <Skeleton height="40px" width="46%" borderRadius="md" />
          </Box>
        ))}
      </SimpleGrid>
      <TournamentMatchListSkeleton count={4} />
    </VStack>
  );
}

function ProfileCardWrapper({ children }: { children: ReactNode }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      bg="white"
      overflow="hidden"
      boxShadow="0 20px 60px rgba(15, 23, 42, 0.08)"
      _dark={{
        bg: 'gray.800',
        borderColor: 'gray.700',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.28)',
      }}
    >
      {children}
    </Box>
  );
}

function ProfileHeroSkeleton({
  avatarVariant,
  metaRows,
}: {
  avatarVariant: 'round' | 'square';
  metaRows: number;
}) {
  const metaWidths = ['72%', '52%', '44%'];

  return (
    <Box
      position="relative"
      overflow="hidden"
      bg="green.700"
      w="full"
      aspectRatio={{ base: 21 / 9, md: 'auto' }}
      h={{ md: '300px' }}
      minH={{ base: '180px', md: '240px' }}
      maxH={{ base: '250px', md: '300px' }}
    >
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(135deg, #0f7a38 0%, #0b5d31 48%, #123c69 100%)"
      />
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(90deg, rgba(3, 18, 12, 0.78) 0%, rgba(3, 18, 12, 0.52) 50%, rgba(3, 18, 12, 0.18) 100%)"
      />
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(0deg, rgba(3, 18, 12, 0.78) 0%, rgba(3, 18, 12, 0) 56%)"
      />
      <Flex
        position="relative"
        h="full"
        minH={{ base: '180px', md: '240px' }}
        align="flex-end"
        px={{ base: 5, md: 7 }}
        py={{ base: 6, md: 7 }}
      >
        <VStack align="stretch" gap={5} w="full">
          <HStack gap={3}>
            {avatarVariant === 'round' ? (
              <SkeletonCircle size={{ base: '70px', md: '86px' }} />
            ) : (
              <Skeleton
                w={{ base: '64px', md: '76px' }}
                h={{ base: '64px', md: '76px' }}
                borderRadius="2xl"
              />
            )}
            <Box flex={1} minW={0}>
              <Skeleton height="14px" width="96px" mb={3} borderRadius="md" />
              <Skeleton height="32px" width="58%" borderRadius="md" />
            </Box>
          </HStack>
          <VStack align="stretch" gap={2} maxW="760px">
            {repeat(metaRows).map((_, index) => (
              <Skeleton
                key={index}
                height="16px"
                width={metaWidths[index] ?? '48%'}
                borderRadius="md"
              />
            ))}
          </VStack>
        </VStack>
      </Flex>
    </Box>
  );
}

function ProfileSectionHeadingSkeleton({
  width = '150px',
  withCount = false,
}: {
  width?: string;
  withCount?: boolean;
}) {
  return (
    <HStack gap={2} mb={3}>
      <Skeleton height="18px" width="18px" borderRadius="md" />
      <Skeleton height="22px" width={width} borderRadius="md" />
      {withCount && <Skeleton height="20px" width="28px" borderRadius="full" />}
    </HStack>
  );
}

function ProfileScheduleCardSkeleton({ lines = 2 }: { lines?: number }) {
  const lineWidths = ['76%', '52%', '40%'];

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={4}
      bg="white"
      boxShadow="0 10px 26px rgba(15, 23, 42, 0.04)"
      _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box flex={1} minW={0}>
          <Skeleton height="18px" width="58%" mb={2} borderRadius="md" />
          {repeat(lines).map((_, index) => (
            <Skeleton
              key={index}
              height="14px"
              width={lineWidths[index] ?? '40%'}
              mt={index === 0 ? 0 : 1}
              borderRadius="md"
            />
          ))}
        </Box>
        <Skeleton height="22px" width="72px" borderRadius="full" />
      </Flex>
    </Box>
  );
}

function ProfileQrBarSkeleton() {
  return (
    <Box borderRadius="2xl" boxShadow="0 14px 40px rgba(15, 23, 42, 0.05)">
      <Flex
        align="center"
        gap={3}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        px={3}
        py={2.5}
        bg="white"
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      >
        <Box
          bg="white"
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.100"
          p={1}
          flexShrink={0}
          _dark={{ borderColor: 'gray.600' }}
        >
          <Skeleton height="64px" width="64px" borderRadius="sm" />
        </Box>
        <HStack gap={2} flexWrap="wrap">
          <Skeleton height="32px" width="92px" borderRadius="md" />
          <Skeleton height="32px" width="112px" borderRadius="md" />
        </HStack>
      </Flex>
    </Box>
  );
}

export function PublicTournamentPlayerSkeleton() {
  return (
    <VStack align="stretch" gap={5}>
      <ProfileCardWrapper>
        <ProfileHeroSkeleton avatarVariant="round" metaRows={3} />
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'flex-start' }}
          gap={6}
          p={{ base: 5, md: 7 }}
        >
          <VStack align="stretch" gap={7} flex={1} minW={0} w="full">
            <Box w="full">
              <ProfileSectionHeadingSkeleton width="150px" />
              <VStack align="stretch" gap={3}>
                {repeat(2).map((_, index) => (
                  <Box
                    key={index}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="xl"
                    p={4}
                    bg="white"
                    boxShadow="0 10px 26px rgba(15, 23, 42, 0.04)"
                    _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                  >
                    <Flex justify="space-between" align="flex-start" gap={3}>
                      <Box flex={1} minW={0}>
                        <Skeleton height="18px" width="55%" borderRadius="md" />
                        <Skeleton
                          height="14px"
                          width="40%"
                          mt={2}
                          borderRadius="md"
                        />
                      </Box>
                      <Skeleton
                        height="22px"
                        width="64px"
                        borderRadius="full"
                      />
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
            <Box>
              <ProfileSectionHeadingSkeleton width="170px" />
              <VStack align="stretch" gap={3}>
                {repeat(2).map((_, index) => (
                  <ProfileScheduleCardSkeleton key={index} lines={2} />
                ))}
              </VStack>
            </Box>
          </VStack>
        </Flex>
      </ProfileCardWrapper>
      <ProfileQrBarSkeleton />
    </VStack>
  );
}

export function PublicTournamentTeamSkeleton() {
  return (
    <VStack align="stretch" gap={5}>
      <ProfileCardWrapper>
        <ProfileHeroSkeleton avatarVariant="square" metaRows={1} />
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'flex-start' }}
          gap={6}
          p={{ base: 5, md: 7 }}
        >
          <VStack align="stretch" gap={7} flex={1} minW={0}>
            <Box>
              <ProfileSectionHeadingSkeleton width="130px" withCount />
              <VStack align="stretch" gap={3}>
                {repeat(3).map((_, index) => (
                  <Flex
                    key={index}
                    align="center"
                    gap={3}
                    w="full"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="xl"
                    p={4}
                    bg="white"
                    boxShadow="0 10px 26px rgba(15, 23, 42, 0.04)"
                    _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
                  >
                    <SkeletonCircle size="38px" />
                    <Skeleton height="18px" width="45%" borderRadius="md" />
                  </Flex>
                ))}
              </VStack>
            </Box>
            <Box w="full">
              <ProfileSectionHeadingSkeleton width="170px" />
              <VStack align="stretch" gap={3}>
                {repeat(2).map((_, index) => (
                  <ProfileScheduleCardSkeleton key={index} lines={1} />
                ))}
              </VStack>
            </Box>
          </VStack>
        </Flex>
      </ProfileCardWrapper>
      <ProfileQrBarSkeleton />
    </VStack>
  );
}

export function ScoreboardSkeleton() {
  return (
    <Box minH="100dvh" bg="gray.950" color="white">
      <Flex
        px={4}
        py={3}
        gap={3}
        align="center"
        justify="space-between"
        borderBottomWidth="1px"
        borderColor="whiteAlpha.200"
      >
        <HStack gap={2}>
          <Skeleton height="34px" width="90px" borderRadius="lg" />
          <Skeleton height="34px" width="110px" borderRadius="lg" />
        </HStack>
        <HStack gap={2}>
          <Skeleton height="34px" width="34px" borderRadius="lg" />
          <Skeleton height="34px" width="34px" borderRadius="lg" />
        </HStack>
      </Flex>
      <Flex px={4} py={2} align="center" justify="center">
        <Skeleton height="18px" width="260px" borderRadius="md" />
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={4} p={4}>
        {repeat(4).map((_, index) => (
          <Box
            key={index}
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            borderRadius="2xl"
            bg="whiteAlpha.100"
            p={5}
            minH="220px"
          >
            <VStack align="stretch" gap={5}>
              <HStack justify="space-between">
                <Skeleton height="20px" width="90px" borderRadius="md" />
                <Skeleton height="20px" width="72px" borderRadius="full" />
              </HStack>
              <VStack align="stretch" gap={4}>
                <Skeleton height="28px" width="82%" borderRadius="md" />
                <Skeleton
                  height="54px"
                  width="110px"
                  alignSelf="center"
                  borderRadius="lg"
                />
                <Skeleton height="28px" width="78%" borderRadius="md" />
              </VStack>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
