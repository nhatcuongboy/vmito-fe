'use client';

import React from 'react';
import { Box, Flex, HStack, IconButton, Spinner, Text } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { BoxProps } from '@chakra-ui/react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ITableContainerProps extends BoxProps {
  /** Show a loading overlay over the table content */
  isLoading?: boolean;
}

export interface IVTablePaginationProps {
  page: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  /** Optional label slot, e.g. "120 items · page 2/6" */
  label?: string;
}

// ─── Components ───────────────────────────────────────────────────────────────

export const TableContainer = ({
  children,
  isLoading = false,
  ...props
}: ITableContainerProps) => (
  <Box
    position="relative"
    overflowX="auto"
    bg="white"
    _dark={{ bg: 'gray.800' }}
    borderRadius="lg"
    borderWidth="1px"
    borderColor="gray.200"
    boxShadow="sm"
    {...props}
  >
    {children}
    {isLoading && (
      <Flex
        position="absolute"
        inset="0"
        bg="whiteAlpha.700"
        _dark={{ bg: 'blackAlpha.500' }}
        alignItems="center"
        justifyContent="center"
        borderRadius="lg"
        zIndex={10}
      >
        <Spinner size="lg" colorPalette="green" />
      </Flex>
    )}
  </Box>
);

export const Table = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => (
  <Box
    as="table"
    width="100%"
    style={{ borderCollapse: 'collapse', tableLayout: 'auto' }}
    {...props}
  >
    {children}
  </Box>
);

export const Thead = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => (
  <Box
    as="thead"
    bg="gray.50"
    _dark={{ bg: 'gray.700' }}
    borderBottomWidth="1px"
    borderColor="gray.200"
    {...props}
  >
    {children}
  </Box>
);

export const Tbody = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => (
  <Box as="tbody" {...props}>
    {children}
  </Box>
);

export const Tr = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => (
  <Box
    as="tr"
    borderBottomWidth="1px"
    borderColor="gray.100"
    _dark={{ borderColor: 'gray.700' }}
    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.750' } }}
    transition="background 0.15s"
    {...props}
  >
    {children}
  </Box>
);

export const Th = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => (
  <Box
    as="th"
    px="4"
    py="3"
    fontWeight="semibold"
    fontSize="xs"
    textTransform="uppercase"
    letterSpacing="wider"
    color="gray.600"
    _dark={{ color: 'gray.400' }}
    textAlign="left"
    whiteSpace="nowrap"
    {...props}
  >
    {children}
  </Box>
);

export const Td = ({
  children,
  ...props
}: React.PropsWithChildren<BoxProps>) => (
  <Box as="td" px="4" py="4" fontSize="sm" verticalAlign="middle" {...props}>
    {children}
  </Box>
);

/**
 * Standalone pagination bar to place below a <TableContainer>.
 * Renders nothing when totalPages <= 1.
 */
export const VTablePagination = ({
  page,
  totalPages,
  totalCount,
  pageSize,
  isLoading = false,
  onPageChange,
  label,
}: IVTablePaginationProps) => {
  if (totalPages <= 1) return null;

  const defaultLabel = (() => {
    if (totalCount !== undefined && pageSize !== undefined) {
      const from = (page - 1) * pageSize + 1;
      const to = Math.min(page * pageSize, totalCount);
      return `${from}–${to} / ${totalCount}`;
    }
    if (totalCount !== undefined)
      return `${totalCount} items · ${page}/${totalPages}`;
    return `${page} / ${totalPages}`;
  })();

  return (
    <Flex justify="space-between" align="center" pt={2}>
      <Text fontSize="sm" color="gray.500">
        {label ?? defaultLabel}
      </Text>
      <HStack gap={2}>
        <IconButton
          size="sm"
          variant="outline"
          aria-label="Previous page"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant="outline"
          aria-label="Next page"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          <ChevronRight size={16} />
        </IconButton>
      </HStack>
    </Flex>
  );
};
