'use client';

import { Box, Spinner } from '@chakra-ui/react';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import PublicUserProfileContent from '@/components/player/PublicUserProfileContent';

function PublicUserProfilePageContent() {
  const params = useParams();
  const userId = params.userId as string;

  return <PublicUserProfileContent userId={userId} />;
}

export default function PublicUserProfilePage() {
  return (
    <Suspense
      fallback={
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="xl" color="green.500" />
        </Box>
      }
    >
      <PublicUserProfilePageContent />
    </Suspense>
  );
}
