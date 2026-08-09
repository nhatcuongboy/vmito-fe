'use client';

import {
  VIETNAM_CITIES,
  normalizeCityForApi,
  sortWithPopularCitiesFirst,
} from '@/constants/vietnam-locations';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useNewAdminUnits } from '@/hooks/useNewAdminUnits';
import { removeVietnameseTones } from '@/lib/utils';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { Box, Flex, Input, Portal, Text, chakra } from '@chakra-ui/react';
import { Check, ChevronDown, LocateFixed, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Sentinel used only for the "All" menu row; selecting it stores
// preferredCity = null, which every browse page already treats as
// "no city filter" (nationwide).
const ALL_CITY_LABEL = 'Tất cả';

export default function CitySelector({
  hideIcon = false,
}: {
  hideIcon?: boolean;
}) {
  const preferredCity = usePreferenceStore((s) => s.preferredCity);
  const setPreferredCity = usePreferenceStore((s) => s.setPreferredCity);
  const setOnboardingCompleted = usePreferenceStore(
    (s) => s.setOnboardingCompleted
  );
  const { showNewAddress } = useAppSettings();
  const { cityOptions } = useNewAdminUnits();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
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
      sortWithPopularCitiesFirst(
        showNewAddress
          ? cityOptions.map((o) => ({ value: o.value, label: o.label }))
          : VIETNAM_CITIES.map((c) => ({ value: c.code, label: c.name }))
      ),
    [showNewAddress, cityOptions]
  );

  const visibleItems = useMemo(() => {
    if (!showNewAddress || !search.trim()) return items;
    const q = removeVietnameseTones(search).toLowerCase();
    return items.filter((i) =>
      removeVietnameseTones(i.label).toLowerCase().includes(q)
    );
  }, [showNewAddress, search, items]);

  // "All" is the active selection whenever no specific city is stored.
  const isAllSelected = preferredCity === null;

  // Display name (falls back to a legacy code stored before a mode switch).
  const displayName = isAllSelected
    ? ALL_CITY_LABEL
    : formatCity(
        showNewAddress
          ? (legacyCity?.name ?? preferredCity ?? '')
          : (legacyCity?.name ?? '')
      );
  const displayShort = isAllSelected
    ? ALL_CITY_LABEL
    : showNewAddress
      ? displayName
      : (legacyCity?.shortName ?? legacyCity?.name ?? '');

  // Keep a ref to the latest preferredCity so the conversion effect below can
  // read it without adding it to the dependency array (which would cause it to
  // re-run on every user selection).
  const prefRef = useRef(preferredCity);
  useEffect(() => {
    prefRef.current = preferredCity;
  }, [preferredCity]);

  // When the address mode switches, auto-convert the stored preferredCity so
  // it stays in the correct format for the active mode:
  //   legacy mode  → value is a VIETNAM_CITIES code (e.g. 'HCM')
  //   new-address  → value is the full province name (e.g. 'Thành phố Hồ Chí Minh')
  // This effect also re-runs when items first load (cityOptions fetched async),
  // handling the case where the mode switch happened before data arrived.
  useEffect(() => {
    if (items.length === 0) return;
    const city = prefRef.current;
    if (!city) return;

    if (showNewAddress) {
      // If current value is a legacy code, find the matching new-era name.
      const legacy = VIETNAM_CITIES.find((c) => c.code === city);
      if (!legacy) return; // already in new-era format
      const target = removeVietnameseTones(
        normalizeCityForApi(legacy.name)
      ).toLowerCase();
      const match = items.find(
        (item) =>
          removeVietnameseTones(
            normalizeCityForApi(item.label)
          ).toLowerCase() === target
      );
      if (match) setPreferredCity(match.value);
    } else {
      // If current value is a new-era name, find the matching legacy code.
      const isAlreadyCode = VIETNAM_CITIES.some((c) => c.code === city);
      if (isAlreadyCode) return; // already a legacy code
      const target = removeVietnameseTones(
        normalizeCityForApi(city)
      ).toLowerCase();
      const match = VIETNAM_CITIES.find(
        (c) =>
          removeVietnameseTones(normalizeCityForApi(c.name)).toLowerCase() ===
          target
      );
      if (match) setPreferredCity(match.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewAddress, items]);

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

  const handleSelectAll = () => {
    // null = no city filter (nationwide). Mark onboarding complete so the
    // CityOnboardingModal doesn't treat this as an unset preference.
    setPreferredCity(null);
    setOnboardingCompleted(true);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setGeoError(false);
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`
          );
          const data = await res.json();
          // Nominatim no longer exposes a clean province-level `state` for
          // reformed units (e.g. HCM returns city="Thành phố Thủ Đức" with the
          // province only present inside `display_name`). Search across every
          // address component plus the full display name so province-level
          // names are still detected.
          const address = data?.address ?? {};
          const haystacks = [
            address.state,
            address.region,
            address.province,
            address.city,
            address.county,
            data?.display_name,
          ]
            .filter(Boolean)
            .map((value: string) =>
              removeVietnameseTones(String(value)).toLowerCase()
            );
          if (haystacks.length === 0) {
            setGeoError(true);
            return;
          }
          // Prefer the longest label so province-level names (e.g.
          // "Hồ Chí Minh") win over granular parts (e.g. "Thủ Đức").
          const matched = [...items]
            .sort((a, b) => b.label.length - a.label.length)
            .find((item) => {
              const labelNorm = removeVietnameseTones(
                normalizeCityForApi(item.label)
              ).toLowerCase();
              return haystacks.some((h: string) => h.includes(labelNorm));
            });
          if (matched) {
            handleSelect(matched.value);
          } else {
            setGeoError(true);
          }
        } catch {
          setGeoError(true);
        } finally {
          setIsGeolocating(false);
        }
      },
      () => {
        setIsGeolocating(false);
        setGeoError(true);
      },
      { timeout: 10000 }
    );
  };

  return (
    <>
      <chakra.button
        className="top-bar-city-trigger"
        type="button"
        ref={buttonRef}
        display="flex"
        alignItems="center"
        gap={1}
        pl={hideIcon ? 2.5 : { base: 1.5, md: 2.5 }}
        pr={{ base: 1.5, md: 2.5 }}
        py={1}
        borderRadius="full"
        borderWidth="1px"
        borderColor={isOpen ? 'brand.400' : 'border'}
        bg={isOpen ? 'bg.muted' : 'bg'}
        color={isOpen ? 'fg' : 'fg.muted'}
        cursor="pointer"
        _hover={{
          borderColor: 'brand.400',
          bg: 'bg.muted',
          color: 'fg',
        }}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={displayName || 'Chọn thành phố'}
        userSelect="none"
        transition="background-color 0.15s, border-color 0.15s, color 0.15s"
      >
        {!hideIcon && <MapPin size={15} aria-hidden="true" />}

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
            aria-hidden="true"
            style={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Box>
      </chakra.button>

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
            {/* Use current location button */}
            <Flex
              align="center"
              gap={2}
              px={4}
              py={2.5}
              cursor={isGeolocating ? 'not-allowed' : 'pointer'}
              borderBottomWidth="1px"
              borderColor="border"
              opacity={isGeolocating ? 0.6 : 1}
              _hover={{ bg: isGeolocating ? 'transparent' : 'bg.muted' }}
              onClick={isGeolocating ? undefined : handleUseCurrentLocation}
              transition="background 0.1s"
            >
              <Box
                color="blue.500"
                className={isGeolocating ? 'animate-spin' : undefined}
              >
                <LocateFixed size={14} />
              </Box>
              <Text fontSize="sm" fontWeight="500" color="blue.500">
                {isGeolocating
                  ? 'Đang xác định vị trí...'
                  : 'Dùng vị trí hiện tại'}
              </Text>
            </Flex>
            {geoError && (
              <Text px={4} py={1.5} fontSize="xs" color="red.500">
                Không thể xác định vị trí. Vui lòng thử lại.
              </Text>
            )}
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
              {/* "All" (nationwide) — hidden while actively searching */}
              {!search.trim() && (
                <Flex
                  align="center"
                  justify="space-between"
                  gap={2}
                  px={4}
                  py={2.5}
                  cursor="pointer"
                  bg={isAllSelected ? 'green.50' : 'transparent'}
                  _hover={{ bg: isAllSelected ? 'green.50' : 'bg.muted' }}
                  _dark={{
                    bg: isAllSelected ? 'green.950' : 'transparent',
                    _hover: {
                      bg: isAllSelected ? 'green.950' : 'whiteAlpha.100',
                    },
                  }}
                  onClick={handleSelectAll}
                  transition="background 0.1s"
                >
                  <Text
                    fontSize="sm"
                    fontWeight={isAllSelected ? '600' : '400'}
                    color={isAllSelected ? 'green.700' : 'fg'}
                    _dark={{ color: isAllSelected ? 'green.300' : 'fg' }}
                    truncate
                  >
                    {ALL_CITY_LABEL}
                  </Text>
                  {isAllSelected && (
                    <Check
                      size={14}
                      color="var(--chakra-colors-green-500)"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </Flex>
              )}
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
