'use client';

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

export function TournamentCardSkeleton() {
  return (
    <Box
      bg="bg"
      borderRadius="xl"
      overflow="hidden"
      border="1px solid"
      borderColor="border"
    >
      <Skeleton height="180px" width="100%" />
      <Box p={4}>
        <VStack align="stretch" gap={2}>
          <Skeleton height="14px" width="45%" borderRadius="md" />
          <Skeleton height="22px" width="80%" borderRadius="md" />
          <Skeleton height="22px" width="62%" borderRadius="md" />
          <Skeleton height="14px" width="90%" borderRadius="md" />
          <HStack
            gap={0}
            pt={2}
            borderTop="1px solid"
            borderColor="border"
            mt={1}
          >
            <Skeleton height="28px" flex={1} borderRadius="md" />
            <Skeleton height="28px" flex={1} borderRadius="md" />
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}

export function TournamentCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
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
    <VStack gap={4} align="stretch">
      {repeat(count).map((_, index) => (
        <HostTournamentRowSkeleton key={index} />
      ))}
    </VStack>
  );
}

function TournamentSidebarSkeleton() {
  return (
    <Box
      w="280px"
      flexShrink={0}
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      bg="white"
      p={4}
      position="sticky"
      top="96px"
      alignSelf="flex-start"
    >
      <VStack align="stretch" gap={4}>
        <Skeleton height="92px" borderRadius="xl" />
        {repeat(7).map((_, index) => (
          <HStack key={index} gap={3}>
            <Skeleton height="34px" width="34px" borderRadius="lg" />
            <Skeleton
              height="16px"
              width={index === 0 ? '72%' : '56%'}
              borderRadius="md"
            />
          </HStack>
        ))}
      </VStack>
    </Box>
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
    >
      <HStack gap={3} p={4} bg="gray.50">
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
      <HStack bg="gray.100" borderRadius="full" p={1} w="fit-content">
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

export function TournamentShellSkeleton() {
  return (
    <>
      <Flex
        display={{ base: 'none', md: 'flex' }}
        gap={6}
        pt={{ md: 6 }}
        pl={{ md: 4 }}
        pr={{ md: 6 }}
      >
        <TournamentSidebarSkeleton />
        <Box flex="1" minW={0}>
          <VStack align="stretch" gap={5}>
            <Box
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="2xl"
              bg="white"
              overflow="hidden"
            >
              <Skeleton height="180px" />
              <Box p={5}>
                <Skeleton height="30px" width="45%" mb={3} borderRadius="md" />
                <Skeleton height="16px" width="70%" mb={2} borderRadius="md" />
                <Skeleton height="16px" width="52%" borderRadius="md" />
              </Box>
            </Box>
            <SimpleGrid columns={{ md: 2, xl: 3 }} gap={4}>
              {repeat(3).map((_, index) => (
                <Box
                  key={index}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="xl"
                  bg="white"
                  p={4}
                >
                  <Skeleton
                    height="18px"
                    width="60%"
                    mb={3}
                    borderRadius="md"
                  />
                  <Skeleton height="40px" width="46%" borderRadius="md" />
                </Box>
              ))}
            </SimpleGrid>
            <TournamentMatchListSkeleton count={4} />
          </VStack>
        </Box>
      </Flex>

      <Box display={{ base: 'block', md: 'none' }} pb="88px">
        <VStack align="stretch" gap={5}>
          <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            bg="white"
            overflow="hidden"
          >
            <Skeleton height="150px" />
            <Box p={4}>
              <Skeleton height="26px" width="72%" mb={3} borderRadius="md" />
              <Skeleton height="15px" width="90%" mb={2} borderRadius="md" />
              <Skeleton height="15px" width="58%" borderRadius="md" />
            </Box>
          </Box>
          <TournamentMatchListSkeleton count={3} />
        </VStack>
      </Box>
    </>
  );
}

export function PublicTournamentProfileSkeleton() {
  return (
    <VStack align="stretch" gap={5}>
      <Skeleton height="40px" width="156px" borderRadius="lg" />
      <Box
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        bg="white"
        overflow="hidden"
      >
        <Box bg="green.600" px={{ base: 5, md: 6 }} py={6}>
          <HStack gap={3}>
            <SkeletonCircle size="12" />
            <Box flex={1}>
              <Skeleton height="14px" width="96px" mb={3} borderRadius="md" />
              <Skeleton height="32px" width="58%" borderRadius="md" />
            </Box>
          </HStack>
          <VStack align="stretch" gap={2} mt={4}>
            <Skeleton height="16px" width="72%" borderRadius="md" />
            <Skeleton height="16px" width="48%" borderRadius="md" />
          </VStack>
        </Box>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'flex-start' }}
          gap={6}
          p={{ base: 5, md: 6 }}
        >
          <VStack align="stretch" gap={5} flex={1} minW={0}>
            <Skeleton height="24px" width="180px" borderRadius="md" />
            <TournamentMatchListSkeleton count={3} />
          </VStack>
          <Box
            w={{ base: 'full', md: '260px' }}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            p={4}
            bg="gray.50"
            flexShrink={0}
          >
            <VStack gap={3}>
              <Skeleton height="20px" width="120px" borderRadius="md" />
              <Skeleton height="184px" width="184px" borderRadius="lg" />
              <Skeleton height="12px" width="100%" borderRadius="md" />
              <Skeleton height="38px" width="100%" borderRadius="lg" />
            </VStack>
          </Box>
        </Flex>
      </Box>
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
