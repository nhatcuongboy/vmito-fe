'use client';

import type { ReactNode } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Button, VStack } from '@/components/ui/chakra-compat';

interface TournamentManageEmptyStateProps {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
  onAction?: () => void;
}

export default function TournamentManageEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: TournamentManageEmptyStateProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      bg="gray.50"
      px={{ base: 5, md: 6 }}
      py={{ base: 8, md: 10 }}
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <VStack gap={4} align="center" textAlign="center">
        <Flex
          w="48px"
          h="48px"
          borderRadius="full"
          bg="white"
          color="green.600"
          align="center"
          justify="center"
          boxShadow="sm"
          _dark={{ bg: 'gray.900', color: 'green.300' }}
        >
          {icon}
        </Flex>

        <VStack gap={1.5} align="center" maxW="360px">
          <Text fontSize="sm" fontWeight="semibold" color="gray.800">
            {title}
          </Text>
          {description && (
            <Text
              fontSize="sm"
              color="gray.500"
              lineHeight="1.6"
              _dark={{ color: 'gray.400' }}
            >
              {description}
            </Text>
          )}
        </VStack>

        {actionLabel && onAction && (
          <Button size="sm" colorPalette="green" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Box>
  );
}
