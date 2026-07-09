import { Box, Flex, Separator, Skeleton } from '@chakra-ui/react';

import PageLayout from '@/components/layout/PageLayout';
import { HostTournamentListSkeleton } from '@/components/tournament/skeletons';

export default function Loading() {
  return (
    <PageLayout title="Tournaments">
      <Box mb={4}>
        <Skeleton
          height="48px"
          width="100%"
          maxW="650px"
          mx="auto"
          borderRadius="full"
        />
      </Box>
      <Flex justify="space-between" align="center" mb={4} mt={2}>
        <Skeleton height="26px" width="160px" borderRadius="md" />
        <Skeleton height="32px" width="132px" borderRadius="full" />
      </Flex>
      <Separator mb={4} />
      <HostTournamentListSkeleton />
    </PageLayout>
  );
}
