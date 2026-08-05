'use client';

import { Box, Flex, HStack, Separator, Skeleton } from '@chakra-ui/react';

const AppPendingClubRequestCardSkeleton = () => (
  <Box
    bg="bg"
    _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    borderRadius={{ base: 'xl', md: '2xl' }}
    borderWidth="1px"
    borderColor="border"
    overflow="hidden"
  >
    <Box p={{ base: 4, md: 5 }}>
      <Flex align="flex-start" gap={{ base: 3, md: 4 }}>
        <Skeleton
          boxSize={{ base: '52px', md: '58px' }}
          borderRadius="xl"
          flexShrink={0}
        />

        <Box flex={1} minW={0}>
          <HStack justify="space-between" align="flex-start" gap={2}>
            <Box flex={1}>
              <Skeleton h="18px" w="145px" borderRadius="md" />
              <Skeleton mt={2} h="12px" w="110px" borderRadius="md" />
            </Box>
            <Skeleton h="20px" w="96px" borderRadius="md" />
          </HStack>
          <Skeleton mt={4} h="14px" w="85%" borderRadius="md" />
          <Skeleton mt={2} h="12px" w="92px" borderRadius="md" />
        </Box>
      </Flex>
    </Box>

    <Separator />

    <HStack
      px={{ base: 4, md: 5 }}
      py={3}
      justify="space-between"
      bg="bg.muted"
      _dark={{ bg: 'whiteAlpha.50' }}
    >
      <Skeleton h="16px" w="82px" borderRadius="md" />
      <Skeleton h="44px" w="132px" borderRadius="md" />
    </HStack>
  </Box>
);

export default AppPendingClubRequestCardSkeleton;
