'use client';

import { ReactNode } from 'react';
import {
  Box,
  Container,
  Flex,
  Grid,
  HStack,
  Skeleton,
  SkeletonCircle,
  VStack,
} from '@chakra-ui/react';
import { DETAIL_PAGE_MAX_W } from '@/constants';
import PageLayout from './PageLayout';

interface DetailPageSkeletonProps {
  title?: ReactNode;
}

export default function DetailPageSkeleton({ title }: DetailPageSkeletonProps) {
  return (
    <PageLayout title={title} maxW={DETAIL_PAGE_MAX_W}>
      <Container maxW={DETAIL_PAGE_MAX_W} px={0}>
        <Skeleton
          w={{ base: 'calc(100% + 48px)', md: 'full' }}
          h={{ base: 'clamp(180px, 30vh, 240px)', md: '300px' }}
          mx={{ base: '-24px', md: 0 }}
          borderRadius={{ base: 0, md: '2xl' }}
          mb={4}
        />

        <Box
          w="full"
          bg="white"
          _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          borderRadius="2xl"
          shadow="sm"
          px={{ base: 3, md: 5 }}
          py={{ base: 2, md: 3.5 }}
          borderWidth="1px"
          borderColor="gray.100"
          mb={4}
        >
          <Flex gap={{ base: 3, md: 4 }} align="center">
            <SkeletonCircle size="48px" flexShrink={0} />
            <Box flex="1" minW={0}>
              <Skeleton height="26px" width="55%" borderRadius="md" />
              <Skeleton height="14px" width="36%" borderRadius="md" mt={2} />
            </Box>
          </Flex>
        </Box>
      </Container>

      <Container maxW={DETAIL_PAGE_MAX_W} pb={8} px={0}>
        <HStack
          gap={1}
          bg="white"
          _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
          shadow="sm"
          borderRadius="2xl"
          p={1.5}
          mb={3}
          borderWidth="1px"
          borderColor="gray.100"
        >
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} flex="1" height="36px" borderRadius="xl" />
          ))}
        </HStack>

        <Grid templateColumns={{ base: '1fr', lg: '2.3fr 1fr' }} gap={6}>
          <VStack gap={4} align="stretch">
            {[0, 1].map((item) => (
              <Box
                key={item}
                bg="white"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="gray.100"
                p={4}
              >
                <Skeleton height="22px" width="40%" borderRadius="md" mb={4} />
                <VStack gap={2.5} align="stretch">
                  <Skeleton height="14px" width="92%" borderRadius="md" />
                  <Skeleton height="14px" width="76%" borderRadius="md" />
                  <Skeleton height="14px" width="84%" borderRadius="md" />
                </VStack>
              </Box>
            ))}
          </VStack>

          <Box
            bg="white"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="gray.100"
            p={4}
            alignSelf="start"
          >
            <Skeleton height="40px" width="100%" borderRadius="lg" mb={4} />
            <VStack gap={3} align="stretch">
              <Skeleton height="16px" width="72%" borderRadius="md" />
              <Skeleton height="16px" width="64%" borderRadius="md" />
              <Skeleton height="16px" width="80%" borderRadius="md" />
            </VStack>
          </Box>
        </Grid>
      </Container>
    </PageLayout>
  );
}
