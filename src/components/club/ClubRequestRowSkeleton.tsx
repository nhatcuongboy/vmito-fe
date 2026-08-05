'use client';

import { Box, Flex, HStack, Skeleton } from '@chakra-ui/react';

export default function ClubRequestRowSkeleton() {
  return (
    <Flex
      p={{ base: 4, md: 5 }}
      bg="bg"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
      borderRadius={{ base: 'xl', md: 'lg' }}
      borderWidth="1px"
      borderColor="border"
      align="center"
      justify="space-between"
      gap={{ base: 3, md: 4 }}
      flexDirection={{ base: 'column', sm: 'row' }}
    >
      {/* Left: icon box + text lines */}
      <HStack gap={{ base: 3, md: 4 }} w={{ base: 'full', sm: 'auto' }}>
        <Skeleton
          height={{ base: '40px', md: '48px' }}
          width={{ base: '40px', md: '48px' }}
          borderRadius="lg"
          flexShrink={0}
        />
        <Box flex={1} minW={0}>
          <Skeleton height="16px" width="140px" mb={1.5} borderRadius="md" />
          <Skeleton height="14px" width="180px" borderRadius="md" />
          <Skeleton height="14px" width="85%" mt={2} borderRadius="md" />
          <HStack mt={2} gap={3}>
            <Skeleton height="12px" width="72px" borderRadius="md" />
            <Skeleton height="12px" width="64px" borderRadius="md" />
          </HStack>
        </Box>
      </HStack>

      {/* Right: action buttons */}
      <HStack gap={2} w={{ base: 'full', sm: 'auto' }}>
        <Skeleton
          height="44px"
          flex={{ base: 1, sm: 'initial' }}
          width={{ base: 'auto', sm: '80px' }}
          borderRadius="md"
        />
        <Skeleton
          height="44px"
          flex={{ base: 1, sm: 'initial' }}
          width={{ base: 'auto', sm: '80px' }}
          borderRadius="md"
        />
      </HStack>
    </Flex>
  );
}
