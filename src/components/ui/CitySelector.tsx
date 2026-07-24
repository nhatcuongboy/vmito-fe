'use client';

import {
  VIETNAM_CITIES,
  normalizeCityForApi,
} from '@/constants/vietnam-locations';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useNewAdminUnits } from '@/hooks/useNewAdminUnits';
import { removeVietnameseTones } from '@/lib/utils';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { Box, Flex, Input, Portal, Text } from '@chakra-ui/react';
import { Check, ChevronDown, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function CitySelector({
  hideIcon = false,
}: {
  hideIcon?: boolean;
}) {
  const preferredCity = usePreferenceStore((s) => s.preferredCity);
  const setPreferredCity = usePreferenceStore((s) => s.setPreferredCity);
  const { showNewAddress } = useAppSettings();
  const { cityOptions } = useNewAdminUnits();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const legacyCity = VIETNAM_CITIES.find((c) => c.code === preferredCity);

  // Display-only: hide the "Tỉnh"/"Thành phố" prefix on new-era province names.
  // The stored/sent value keeps the full name unchanged.
  const formatCity = (name: string) =>
    showNewAddress ? normalizeCityForApi(name) : name;

  // Option list + selected label depend on the address mode. Legacy stores a
  // VIETNAM_CITIES code; new-address mode stores the full new-era province name.
  const items = useMemo(
    () =>
      showNewAddress
        ? cityOptions.map((o) => ({ value: o.value, label: o.label }))
        : VIETNAM_CITIES.map((c) => ({ value: c.code, label: c.name })),
    [showNewAddress, cityOptions]
  );

  const visibleItems = useMemo(() => {
    if (!showNewAddress || !search.trim()) return items;
    const q = removeVietnameseTones(search).toLowerCase();
    return items.filter((i) =>
      removeVietnameseTones(i.label).toLowerCase().includes(q)
    );
  }, [showNewAddress, search, items]);

  // Display name (falls back to a legacy code stored before a mode switch).
  const displayName = formatCity(
    showNewAddress
      ? (legacyCity?.name ?? preferredCity ?? '')
      : (legacyCity?.name ?? '')
  );
  const displayShort = showNewAddress
    ? displayName
    : (legacyCity?.shortName ?? legacyCity?.name ?? '');

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const menuWidth = showNewAddress ? 260 : 190;

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const padding = 16;
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
      }
      setDropdownPos({ top: rect.bottom + 6, left });
    }
    setSearch('');
    setIsOpen(true);
  };

  const handleSelect = (value: string) => {
    setPreferredCity(value);
    setIsOpen(false);
  };

  return (
    <>
      <Flex
        ref={buttonRef}
        align="center"
        gap={1}
        pl={hideIcon ? 2.5 : { base: 1.5, md: 2.5 }}
        pr={{ base: 1.5, md: 2.5 }}
        py={1}
        borderRadius="full"
        borderWidth="1px"
        borderColor={isOpen ? 'gray.400' : 'gray.300'}
        bg={isOpen ? 'gray.100' : 'gray.50'}
        color={isOpen ? 'fg' : 'fg.muted'}
        _dark={{
          borderColor: isOpen ? 'gray.500' : 'gray.700',
          bg: isOpen ? 'gray.700' : 'gray.800',
          color: isOpen ? 'fg' : 'gray.300',
        }}
        cursor="pointer"
        _hover={{
          borderColor: 'gray.400',
          bg: 'gray.100',
          color: 'fg',
          _dark: {
            borderColor: 'gray.500',
            bg: 'gray.700',
            color: 'fg',
          },
        }}
        onClick={handleToggle}
        userSelect="none"
        transition="all 0.15s"
      >
        {!hideIcon && <MapPin size={15} />}

        {/* Short text for mobile */}
        <Text
          display={{ base: 'block', md: 'none' }}
          fontSize="sm"
          fontWeight="600"
          maxW="80px"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          {displayShort || 'Chọn TP'}
        </Text>

        {/* Full text for desktop */}
        <Text
          display={{ base: 'none', md: 'block' }}
          fontSize="sm"
          fontWeight="600"
          maxW="140px"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
        >
          {displayName || 'Chọn thành phố'}
        </Text>
        <Box display="block">
          <ChevronDown
            size={12}
            style={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Box>
      </Flex>

      {isOpen && dropdownPos && (
        <Portal>
          <Box
            ref={menuRef}
            position="fixed"
            top={`${dropdownPos.top}px`}
            left={`${dropdownPos.left}px`}
            zIndex={2000}
            bg="bg"
            borderRadius="lg"
            border="1px solid"
            borderColor="border"
            boxShadow="lg"
            width={`${menuWidth}px`}
            py={1}
            overflow="hidden"
          >
            {showNewAddress && (
              <Box px={2} pt={1} pb={2}>
                <Box position="relative">
                  <Box
                    position="absolute"
                    left={2.5}
                    top="50%"
                    transform="translateY(-50%)"
                    color="fg.muted"
                    pointerEvents="none"
                  >
                    <Search size={14} />
                  </Box>
                  <Input
                    autoFocus
                    id="city-selector-search"
                    name="city-selector-search"
                    autoComplete="off"
                    size="sm"
                    pl={8}
                    borderRadius="md"
                    placeholder="Tìm tỉnh / thành phố..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </Box>
              </Box>
            )}
            <Box maxH="300px" overflowY="auto">
              {visibleItems.length === 0 ? (
                <Text px={4} py={3} fontSize="sm" color="fg.muted">
                  Không tìm thấy kết quả
                </Text>
              ) : (
                visibleItems.map((item) => {
                  const isSelected = item.value === preferredCity;
                  return (
                    <Flex
                      key={item.value}
                      align="center"
                      justify="space-between"
                      gap={2}
                      px={4}
                      py={2.5}
                      cursor="pointer"
                      bg={isSelected ? 'green.50' : 'transparent'}
                      _hover={{ bg: isSelected ? 'green.50' : 'bg.muted' }}
                      _dark={{
                        bg: isSelected ? 'green.950' : 'transparent',
                        _hover: {
                          bg: isSelected ? 'green.950' : 'whiteAlpha.100',
                        },
                      }}
                      onClick={() => handleSelect(item.value)}
                      transition="background 0.1s"
                    >
                      <Text
                        fontSize="sm"
                        fontWeight={isSelected ? '600' : '400'}
                        color={isSelected ? 'green.700' : 'fg'}
                        _dark={{ color: isSelected ? 'green.300' : 'fg' }}
                        truncate
                      >
                        {formatCity(item.label)}
                      </Text>
                      {isSelected && (
                        <Check
                          size={14}
                          color="var(--chakra-colors-green-500)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </Flex>
                  );
                })
              )}
            </Box>
          </Box>
        </Portal>
      )}
    </>
  );
}
