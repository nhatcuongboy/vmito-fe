import { Box, Container, Skeleton, Stack } from '@chakra-ui/react';
import { SimpleGrid } from '@/components/ui/chakra-compat';

export default function NewsListSkeleton() {
  return (
    <Box bg="bg.subtle" minH="100vh">
      <Container maxW="container.xl" py={{ base: 5, md: 8 }}>
        <Stack gap={2} mb={6}>
          <Skeleton height="32px" width="220px" />
          <Skeleton height="18px" width="320px" />
        </Stack>
        <Skeleton aspectRatio={21 / 9} borderRadius="xl" mb={6} />
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} height="300px" borderRadius="xl" />
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
