'use client';

import { Box, Skeleton } from '@chakra-ui/react';
import { SimpleGrid } from '@/components/ui/chakra-compat';

/** Placeholder shown while a category/tag filter is being applied. */
export default function ArticleCardSkeletonGrid({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <>
      <Box mb={{ base: 4, md: 6 }}>
        <Skeleton aspectRatio={21 / 9} borderRadius="xl" />
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} height="300px" borderRadius="xl" />
        ))}
      </SimpleGrid>
    </>
  );
}
