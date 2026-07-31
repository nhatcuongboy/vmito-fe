'use client';

import { Box, Flex, Skeleton, SkeletonCircle, VStack } from '@chakra-ui/react';
import { Card, CardBody } from '@/components/ui/chakra-compat';

interface IAppRequestDetailSkeletonProps {
  infoRowCount?: number;
}

export default function AppRequestDetailSkeleton({
  infoRowCount = 4,
}: IAppRequestDetailSkeletonProps) {
  return (
    <Box
      px={{ base: 4, md: 6 }}
      py={6}
      maxW="3xl"
      w="full"
      mx="auto"
      aria-busy="true"
    >
      <Card mb={4} overflow="hidden">
        <CardBody p={{ base: 4, md: 5 }}>
          <VStack align="stretch" gap={4}>
            <Flex align="flex-start" gap={3}>
              <SkeletonCircle size="52px" flexShrink={0} />
              <Box flex={1} minW={0}>
                <Flex justify="space-between" align="flex-start" gap={3}>
                  <Box flex={1}>
                    <Skeleton h="24px" w="55%" borderRadius="md" />
                    <Skeleton mt={2} h="16px" w="72%" borderRadius="md" />
                  </Box>
                  <Skeleton h="22px" w="72px" borderRadius="md" />
                </Flex>
                <Flex mt={3} justify="space-between" gap={3}>
                  <Skeleton h="14px" w="42%" borderRadius="md" />
                  <Skeleton h="18px" w="76px" borderRadius="md" />
                </Flex>
              </Box>
            </Flex>

            <Box pt={4} borderTopWidth="1px" borderColor="border.muted">
              <VStack
                align="stretch"
                gap={4}
                p={4}
                bg="gray.50"
                _dark={{ bg: 'whiteAlpha.50' }}
                borderRadius="lg"
              >
                {Array.from({ length: infoRowCount }, (_, index) => (
                  <Flex key={`request-info-skeleton-${index}`} gap={3}>
                    <Skeleton
                      h="18px"
                      w="18px"
                      flexShrink={0}
                      borderRadius="sm"
                    />
                    <Box flex={1}>
                      <Skeleton h="12px" w="30%" borderRadius="md" />
                      <Skeleton mt={2} h="16px" w="72%" borderRadius="md" />
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      <Flex gap={3} p={{ base: 2, md: 0 }} justify={{ md: 'flex-end' }}>
        <Skeleton
          h="48px"
          flex={{ base: 1, md: 'none' }}
          w={{ md: '140px' }}
          borderRadius="md"
        />
        <Skeleton
          h="48px"
          flex={{ base: 1, md: 'none' }}
          w={{ md: '140px' }}
          borderRadius="md"
        />
      </Flex>
    </Box>
  );
}
