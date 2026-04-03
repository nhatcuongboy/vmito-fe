'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { StandingsColumn } from '../types';

interface PreviewTableProps {
  columns: StandingsColumn[];
}

const PLACEHOLDER_ROWS = 5;

export default function PreviewTable({ columns }: PreviewTableProps) {
  return (
    <Box bg="gray.50" borderRadius="xl" p={4} overflowX="auto">
      <Box minW="400px">
        {/* Header */}
        <Flex
          py={2}
          px={3}
          borderBottomWidth="1px"
          borderColor="gray.200"
          gap={2}
        >
          <Text
            flex={1}
            fontSize="xs"
            fontWeight="bold"
            color="gray.500"
            textTransform="uppercase"
          >
            Team
          </Text>
          <Flex fontSize="xs" fontWeight="bold" color="gray.500" gap={0}>
            <Text w="40px" textAlign="center">
              PTS
            </Text>
            {columns.map((col) => (
              <Text key={col.id} w="40px" textAlign="center">
                {col.abbreviation}
              </Text>
            ))}
          </Flex>
        </Flex>

        {/* Placeholder rows */}
        {Array.from({ length: PLACEHOLDER_ROWS }).map((_, idx) => (
          <Flex
            key={idx}
            py={3}
            px={3}
            borderBottomWidth="1px"
            borderColor="gray.100"
            gap={2}
            align="center"
          >
            <Box flex={1}>
              <Box
                h="10px"
                w={`${60 + Math.random() * 30}%`}
                bg="gray.200"
                borderRadius="full"
              />
            </Box>
            <Flex gap={0}>
              <Flex w="40px" justify="center">
                <Box h="10px" w="16px" bg="gray.200" borderRadius="full" />
              </Flex>
              {columns.map((col) => (
                <Flex key={col.id} w="40px" justify="center">
                  <Box h="10px" w="16px" bg="gray.200" borderRadius="full" />
                </Flex>
              ))}
            </Flex>
          </Flex>
        ))}
      </Box>
    </Box>
  );
}
