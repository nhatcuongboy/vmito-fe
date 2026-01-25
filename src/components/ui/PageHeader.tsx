'use client';

import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <Box mb={1}>
      <Flex
        justify="space-between"
        align={{ base: 'start', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Box>
          <Heading size="lg" fontWeight="bold" color="gray.900" mb={1}>
            {title}
          </Heading>
          {description && (
            <Text color="gray.600" fontSize="sm">
              {description}
            </Text>
          )}
        </Box>
        {actions && (
          <Flex gap={2} align="center">
            {actions}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
