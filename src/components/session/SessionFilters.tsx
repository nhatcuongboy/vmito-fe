'use client';
import { Input } from '@/components/ui/Input';
import { Button, IconButton } from '@/components/ui/chakra-compat';
import { useDisclosure } from '@/components/ui/ChakraHooks';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import SessionSearchBar from './SessionSearchBar';
import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Calendar, Check, Filter, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ISessionFiltersProps,
  ISessionFilterState,
} from './SessionFilters.types';
import { SessionStatus } from '@/lib/api/types';
import { TOP_BAR_HEIGHT_MOBILE, TOP_BAR_HEIGHT_DESKTOP } from '@/constants';

const SessionFilters: React.FC<ISessionFiltersProps> = ({
  onFilterChange,
  showLevelFilter = false,
  showDateFilter = true,
  showSearchFilter = true,
  showStatusFilter = true,
  initialFilters = {},
  onCreateClick,
}) => {
  const t = useTranslations('session.filters');
  const tStatus = useTranslations('session.status');
  const tCommon = useTranslations('common');

  const [filters, setFilters] = useState<ISessionFilterState>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(
    initialFilters.searchQuery || ''
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Pending filter states for drawer
  const [pendingStatus, setPendingStatus] = useState<string | undefined>(
    initialFilters.status
  );
  const [pendingDate, setPendingDate] = useState<string | undefined>(
    initialFilters.date
  );
  const [pendingLevel, setPendingLevel] = useState<number | undefined>(
    initialFilters.level
  );

  const { isOpen: showDrawer, onToggle: toggleDrawer } = useDisclosure(false);

  // Sync pending filters when drawer opens
  useEffect(() => {
    if (showDrawer) {
      setPendingStatus(filters.status);
      setPendingDate(filters.date);
      setPendingLevel(filters.level);
    }
  }, [showDrawer, filters.status, filters.date, filters.level]);

  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: debouncedSearchTerm || undefined,
    }));
  }, [debouncedSearchTerm]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSubmitFilters = () => {
    setFilters((prev) => ({
      ...prev,
      status: pendingStatus,
      date: pendingDate,
      level: pendingLevel,
    }));
    toggleDrawer();
  };

  const handleResetFilters = () => {
    setPendingStatus(undefined);
    setPendingDate(undefined);
    setPendingLevel(undefined);
  };

  const activeFilterCount =
    (filters.status ? 1 : 0) + (filters.date ? 1 : 0) + (filters.level ? 1 : 0);

  const statusItems = [
    { value: SessionStatus.PREPARING, label: tStatus('preparing') },
    { value: SessionStatus.IN_PROGRESS, label: tStatus('inProgress') },
    { value: SessionStatus.FINISHED, label: tStatus('finished') },
  ];

  const levelItems = Array.from({ length: 8 }, (_, i) => ({
    value: i + 1,
    label: tCommon(`levels.${i + 1}`),
  }));

  return (
    <Box>
      {/* Sticky Search Bar */}
      {showSearchFilter && (
        <SessionSearchBar
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          onToggleFilters={toggleDrawer}
          activeFilterCount={activeFilterCount}
          onCreateClick={onCreateClick}
        />
      )}

      {/* Filter Drawer Overlay */}
      {showDrawer && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          zIndex={2000}
          onClick={toggleDrawer}
        />
      )}

      {/* Filter Drawer */}
      <Box
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        width={{ base: '90%', md: '480px', lg: '520px' }}
        bg="white"
        _dark={{ bg: 'gray.800' }}
        shadow="2xl"
        zIndex={2100}
        transform={showDrawer ? 'translateX(0)' : 'translateX(100%)'}
        transition="transform 0.3s ease-in-out"
        display="flex"
        flexDirection="column"
      >
        {/* Drawer Header */}
        <Box
          px={4}
          height={{
            base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
            md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
          }}
          pt="env(safe-area-inset-top)"
          display="flex"
          alignItems="center"
          borderBottomWidth="1px"
          borderColor="gray.200"
          _dark={{ borderColor: 'gray.700' }}
        >
          <Flex justify="space-between" align="center" width="full">
            <HStack gap={2}>
              <Filter size={20} />
              <Heading size="md">{t('title') || 'Bộ lọc'}</Heading>
            </HStack>
            <IconButton
              variant="ghost"
              onClick={toggleDrawer}
              aria-label="Đóng"
              icon={<X size={20} />}
            />
          </Flex>
        </Box>

        {/* Drawer Body */}
        <Box flex="1" overflowY="auto" p={5}>
          <VStack align="stretch" gap={5}>
            {/* Status Filter */}
            {showStatusFilter && (
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      {t('sessionStatus')}
                    </Text>
                    {pendingStatus && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        1
                      </Badge>
                    )}
                  </HStack>
                  {pendingStatus && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPendingStatus(undefined)}
                      colorPalette="red"
                      fontWeight="semibold"
                    >
                      <X size={14} /> <Text ml={1}>Xóa</Text>
                    </Button>
                  )}
                </Flex>
                <Flex gap={2} flexWrap="wrap">
                  {statusItems.map((item) => (
                    <Badge
                      key={item.value}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      cursor="pointer"
                      variant={
                        pendingStatus === item.value ? 'solid' : 'outline'
                      }
                      colorPalette={
                        pendingStatus === item.value ? 'green' : 'gray'
                      }
                      onClick={() =>
                        setPendingStatus(
                          pendingStatus === item.value ? undefined : item.value
                        )
                      }
                      fontSize="sm"
                      fontWeight="medium"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      borderWidth={pendingStatus === item.value ? '0' : '2px'}
                    >
                      {item.label}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}

            {showStatusFilter && showDateFilter && (
              <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
            )}

            {/* Date Filter */}
            {showDateFilter && (
              <Box>
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack gap={2}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.700"
                      _dark={{ color: 'gray.200' }}
                    >
                      {t('date')}
                    </Text>
                    {pendingDate && (
                      <Badge
                        size="sm"
                        colorPalette="green"
                        variant="solid"
                        borderRadius="full"
                        px={2}
                      >
                        1
                      </Badge>
                    )}
                  </HStack>
                  {pendingDate && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPendingDate(undefined)}
                      colorPalette="red"
                      fontWeight="semibold"
                    >
                      <X size={14} /> <Text ml={1}>Xóa</Text>
                    </Button>
                  )}
                </Flex>
                <Input
                  type="date"
                  value={pendingDate || ''}
                  onChange={(e) => setPendingDate(e.target.value || undefined)}
                  bg="gray.50"
                  borderColor="gray.200"
                  h="44px"
                  fontSize="sm"
                  _dark={{ bg: 'gray.700', borderColor: 'gray.600' }}
                  leftElement={<Calendar size={16} style={{ opacity: 0.6 }} />}
                  borderRadius="lg"
                />
              </Box>
            )}

            {/* Level Filter */}
            {showLevelFilter && (
              <>
                <Box h="1px" bg="gray.200" _dark={{ bg: 'gray.700' }} />
                <Box>
                  <Flex justify="space-between" align="center" mb={3}>
                    <HStack gap={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.700"
                        _dark={{ color: 'gray.200' }}
                      >
                        {tCommon('selectLevel')}
                      </Text>
                      {pendingLevel && (
                        <Badge
                          size="sm"
                          colorPalette="green"
                          variant="solid"
                          borderRadius="full"
                          px={2}
                        >
                          1
                        </Badge>
                      )}
                    </HStack>
                    {pendingLevel && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setPendingLevel(undefined)}
                        colorPalette="red"
                        fontWeight="semibold"
                      >
                        <X size={14} /> <Text ml={1}>Xóa</Text>
                      </Button>
                    )}
                  </Flex>
                  <Flex gap={2} flexWrap="wrap">
                    {levelItems.map((item) => (
                      <Badge
                        key={item.value}
                        px={4}
                        py={2}
                        borderRadius="lg"
                        cursor="pointer"
                        variant={
                          pendingLevel === item.value ? 'solid' : 'outline'
                        }
                        colorPalette={
                          pendingLevel === item.value ? 'green' : 'gray'
                        }
                        onClick={() =>
                          setPendingLevel(
                            pendingLevel === item.value ? undefined : item.value
                          )
                        }
                        fontSize="sm"
                        fontWeight="medium"
                        transition="all 0.2s"
                        _hover={{ transform: 'scale(1.05)' }}
                        borderWidth={pendingLevel === item.value ? '0' : '2px'}
                      >
                        {item.label}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              </>
            )}
          </VStack>
        </Box>

        {/* Drawer Footer */}
        <Box
          p={4}
          pb={{ base: 'calc(16px + env(safe-area-inset-bottom))', md: 4 }}
          borderTopWidth="1px"
          borderColor="gray.200"
          bg="gray.50"
          _dark={{ borderColor: 'gray.700', bg: 'gray.900' }}
        >
          <Flex gap={3}>
            <Button
              flex="1"
              variant="solid"
              colorPalette="green"
              onClick={handleSubmitFilters}
              leftIcon={<Check size={18} />}
            >
              {t('applySearch')}
            </Button>
            <Button
              flex="1"
              variant="outline"
              colorPalette="gray"
              onClick={handleResetFilters}
              leftIcon={<X size={18} />}
            >
              {t('reset')}
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default SessionFilters;
