'use client';

import { Box, Flex, Skeleton, SkeletonCircle, VStack } from '@chakra-ui/react';

const MEMBER_SKELETON_COUNT = 4;

export default function ClubMembersSkeleton() {
  return (
    <Box aria-busy="true">
      <Flex
        mb={6}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Flex align="center" gap={3} minW={0}>
          <SkeletonCircle size="56px" flexShrink={0} />
          <Box flex={1} minW={0}>
            <Skeleton h="26px" w={{ base: '180px', md: '240px' }} />
            <Flex mt={2} gap={2}>
              <Skeleton h="22px" w="96px" borderRadius="full" />
              <Skeleton h="32px" w="104px" borderRadius="md" />
            </Flex>
          </Box>
        </Flex>
        <Skeleton
          h="48px"
          w={{ base: 'full', md: '164px' }}
          borderRadius="md"
        />
      </Flex>

      <Flex
        w={{ base: 'full', md: 'fit-content' }}
        gap={1}
        p={1}
        bg="bg.muted"
        borderRadius="lg"
      >
        <Skeleton
          h="48px"
          flex={{ base: 1, md: 'none' }}
          w={{ md: '148px' }}
          borderRadius="md"
        />
        <Skeleton
          h="48px"
          flex={{ base: 1, md: 'none' }}
          w={{ md: '172px' }}
          borderRadius="md"
        />
      </Flex>

      <VStack pt={4} gap={3} align="stretch">
        {Array.from({ length: MEMBER_SKELETON_COUNT }, (_, index) => (
          <Flex
            key={`club-member-skeleton-${index}`}
            p={{ base: 4, md: 3 }}
            gap={3}
            align={{ base: 'flex-start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            borderWidth="1px"
            borderColor="border.muted"
            borderRadius="lg"
            bg="bg"
          >
            <Flex gap={3} align="center" flex={1} w="full" minW={0}>
              <SkeletonCircle size="40px" flexShrink={0} />
              <Box flex={1}>
                <Skeleton h="16px" w="42%" borderRadius="md" />
                <Skeleton mt={2} h="14px" w="64%" borderRadius="md" />
              </Box>
            </Flex>
            <Flex gap={2} w={{ base: 'full', md: 'auto' }} justify="flex-end">
              <Skeleton
                h="40px"
                flex={{ base: 1, md: 'none' }}
                w={{ md: '148px' }}
                borderRadius="md"
              />
              <Skeleton h="40px" w="40px" borderRadius="md" />
            </Flex>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
