'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
  Spinner,
  Text,
} from '@chakra-ui/react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ListFilter,
} from 'lucide-react';
import type { BoxProps } from '@chakra-ui/react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export type TSortDirection = 'asc' | 'desc';

export interface ISortConfig<TKey = string> {
  key: TKey;
  direction: TSortDirection;
}

export interface ITableContainerProps extends BoxProps {
  /** Show a loading overlay over the table content */
  isLoading?: boolean;
}

export interface IThFilterOption {
  label: string;
  value: string;
}

export interface IThProps extends BoxProps {
  /** The data key this column maps to, enables sort when provided */
  sortKey?: string;
  /** Current active sort config */
  sortConfig?: ISortConfig | null;
  /** Called with the column key when the header is clicked */
  onSort?: (key: string) => void;
  /** The data key used for filtering this column */
  filterKey?: string;
  /** Options shown in the filter dropdown */
  filterOptions?: IThFilterOption[];
  /** Currently active filter value for this column */
  filterValue?: string;
  /** Called when a filter option is selected */
  onFilter?: (key: string, value: string) => void;
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

export interface ITableProps extends BoxProps {
  variant?: string;
  size?: string;
}

export const Table = ({
  children,
  variant, // eslint-disable-line @typescript-eslint/no-unused-vars
  size, // eslint-disable-line @typescript-eslint/no-unused-vars
  ...props
}: React.PropsWithChildren<ITableProps>) => (
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

const SortIcon = ({
  sortKey,
  sortConfig,
}: {
  sortKey: string;
  sortConfig?: ISortConfig | null;
}) => {
  if (!sortConfig || sortConfig.key !== sortKey) {
    return <ChevronsUpDown size={12} opacity={0.4} />;
  }
  return sortConfig.direction === 'asc' ? (
    <ArrowUp size={12} />
  ) : (
    <ArrowDown size={12} />
  );
};

export const Th = ({
  children,
  sortKey,
  sortConfig,
  onSort,
  filterKey,
  filterOptions,
  filterValue,
  onFilter,
  ...props
}: React.PropsWithChildren<IThProps>) => {
  const isSortable = !!sortKey && !!onSort;
  const isActive = isSortable && sortConfig?.key === sortKey;
  const isFilterable = !!filterKey && !!filterOptions && !!onFilter;
  const isFiltered = isFilterable && !!filterValue;

  return (
    <Box
      as="th"
      px="4"
      py="3"
      fontWeight="semibold"
      fontSize="sm"
      color={isActive ? 'green.600' : 'gray.600'}
      _dark={{ color: isActive ? 'green.400' : 'gray.400' }}
      textAlign="left"
      whiteSpace="nowrap"
      cursor={isSortable ? 'pointer' : undefined}
      userSelect={isSortable ? 'none' : undefined}
      _hover={isSortable ? { color: 'green.500' } : undefined}
      onClick={isSortable ? () => onSort(sortKey) : undefined}
      {...props}
    >
      <Flex align="center" gap="1">
        {children}
        {isSortable && <SortIcon sortKey={sortKey} sortConfig={sortConfig} />}
        {isFilterable && (
          <MenuRoot positioning={{ placement: 'bottom-start' }}>
            <MenuTrigger asChild>
              <Box
                as="span"
                display="inline-flex"
                alignItems="center"
                ml="0.5"
                px="0.5"
                borderRadius="sm"
                color={isFiltered ? 'green.500' : 'gray.400'}
                _hover={{ color: 'green.500', bg: 'gray.100' }}
                _dark={{
                  color: isFiltered ? 'green.400' : 'gray.500',
                  _hover: { color: 'green.400', bg: 'gray.700' },
                }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                cursor="pointer"
              >
                <ListFilter size={11} />
              </Box>
            </MenuTrigger>
            <MenuContent
              minW="130px"
              fontSize="sm"
              zIndex={100}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {filterOptions.map((opt) => (
                <MenuItem
                  key={opt.value}
                  value={opt.value}
                  fontWeight={filterValue === opt.value ? 'bold' : 'normal'}
                  color={filterValue === opt.value ? 'green.600' : undefined}
                  onClick={() => onFilter(filterKey, opt.value)}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </MenuContent>
          </MenuRoot>
        )}
      </Flex>
    </Box>
  );
};

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
// ─── useFilterable Hook ──────────────────────────────────────────────────────

/**
 * Manages column filter state and returns client-side filtered data.
 *
 * @example
 * const { filteredData, filters, handleFilter } = useFilterable(rows);
 * // In JSX:
 * // <Th filterKey="gender" filterOptions={[...]} filterValue={filters.gender} onFilter={handleFilter}>Gender</Th>
 */
export const useFilterable = <T extends object>(data: T[]) => {
  const [filters, setFilters] = useState<Partial<Record<string, string>>>({});

  const handleFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const filteredData = useMemo(
    () =>
      data.filter((item) =>
        Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          return String((item as Record<string, unknown>)[key]) === value;
        })
      ),
    [data, filters]
  );

  return { filteredData, filters, handleFilter };
};

// ─── useSortable Hook ────────────────────────────────────────────────────────

/**
 * Manages sort state and returns sorted data.
 *
 * Cycle: none → asc → desc → none
 *
 * @example
 * const { sortedData, sortConfig, handleSort } = useSortable(rows);
 * // In JSX:
 * // <Th sortKey="name" sortConfig={sortConfig} onSort={handleSort}>Name</Th>
 */
export const useSortable = <T extends object>(
  data: T[],
  initialConfig?: ISortConfig<keyof T>
) => {
  const [sortConfig, setSortConfig] = useState<ISortConfig<keyof T> | null>(
    initialConfig ?? null
  );

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === 'asc')
          return { key, direction: 'desc' as const };
        return null; // third click clears sort
      }
      return { key, direction: 'asc' as const };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr);
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sortConfig]);

  return { sortedData, sortConfig, handleSort };
};

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
