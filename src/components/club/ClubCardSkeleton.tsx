'use client';

import {
  Box,
  Flex,
  HStack,
  Separator,
  Skeleton,
  VStack,
} from '@chakra-ui/react';

export default function ClubCardSkeleton() {
  return (
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
          <VStack align="stretch" gap={2} flex={1} minW={0}>
            <Flex justify="space-between" gap={3}>
              <Box flex={1} minW={0}>
                <Skeleton h="22px" w="70%" borderRadius="md" />
                <HStack gap={2} mt={1}>
                  <Skeleton h="20px" w="76px" borderRadius="full" />
                  <Skeleton h="14px" w="82px" borderRadius="md" />
                </HStack>
              </Box>
              <Skeleton boxSize="32px" borderRadius="md" flexShrink={0} />
            </Flex>
            <HStack minH="18px" gap={1.5}>
              <Skeleton boxSize="14px" borderRadius="sm" />
              <Skeleton h="12px" w="55%" borderRadius="md" />
            </HStack>
          </VStack>
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
        <HStack gap={2}>
          <Skeleton h="12px" w="55px" borderRadius="md" />
          <Skeleton h="12px" w="90px" borderRadius="md" />
        </HStack>
        <Skeleton boxSize="18px" borderRadius="sm" />
      </HStack>
    </Box>
  );
}
