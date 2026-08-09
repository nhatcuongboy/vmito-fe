'use client';

import { Box, Flex, Skeleton, Stack } from '@chakra-ui/react';

export default function ClassCardSkeleton({
  variant = 'grid',
}: {
  variant?: 'grid' | 'list';
}) {
  return (
    <Box
      bg="white"
      _dark={{ bg: 'gray.800' }}
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      display={variant === 'list' ? 'flex' : 'block'}
      flexDirection="column"
    >
      <Skeleton h="150px" w="100%" />
      <Stack p="4" flex="1" gap="3">
        <Skeleton h="20px" w="70%" />
        <Skeleton h="14px" w="90%" />
        <Skeleton h="14px" w="60%" />
        <Flex gap="2">
          <Skeleton h="22px" w="80px" />
          <Skeleton h="22px" w="100px" />
        </Flex>
      </Stack>
    </Box>
  );
}
