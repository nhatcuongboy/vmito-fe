'use client';

import { MultiSearchableSelect } from '@/components/ui/MultiSearchableSelect';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  sortWithPopularCitiesFirst,
  VIETNAM_CITIES,
} from '@/constants/vietnam-locations';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useNewAdminUnits } from '@/hooks/useNewAdminUnits';
import { Badge, Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { MapPin, X } from 'lucide-react';
import { useMemo } from 'react';

// Filter drawers render at z-index 2100; the dropdowns must sit above them.
const DROPDOWN_Z_INDEX = 2200;

interface LocationFilterFieldsProps {
  /**
   * Selected cities. In legacy mode these are VIETNAM_CITIES codes (e.g. "HCM");
   * in new-address mode they are the full new-era province names. Each consumer
   * already resolves both shapes when flattening to the API city param.
   */
  selectedCities: string[];
  /** Selected district (legacy) or ward (new-address) names. */
  selectedDistricts: string[];
  onCitiesChange: (cities: string[]) => void;
  onDistrictsChange: (districts: string[]) => void;
  /** Section title for the city group (defaults to "Khu vực"). */
  title?: string;
}

/**
 * Shared city + district/ward picker used by the Venues, Sessions, Tournaments
 * and Clubs filters. City/province selection is a single searchable select
 * in both legacy and new-address modes; district/ward selection is a searchable multi-select.
 * All long lists live behind a searchable dropdown so the filter stays compact.
 */
export function LocationFilterFields({
  selectedCities,
  selectedDistricts,
  onCitiesChange,
  onDistrictsChange,
  title = 'Khu vực',
}: LocationFilterFieldsProps) {
  const { showNewAddress } = useAppSettings();
  const { cityOptions, getWardsByCity } = useNewAdminUnits();

  // Legacy province options (code → display name).
  const cityItems = useMemo(
    () => VIETNAM_CITIES.map((c) => ({ value: c.code, label: c.name })),
    []
  );

  // City options for the active mode, with the most-used cities pinned first.
  const sortedCityOptions = useMemo(
    () => sortWithPopularCitiesFirst(showNewAddress ? cityOptions : cityItems),
    [showNewAddress, cityOptions, cityItems]
  );

  // District/ward options available for the currently selected cities.
  const districtItems = useMemo<{ value: string; label: string }[]>(() => {
    if (selectedCities.length === 0) return [];
    if (showNewAddress) {
      const seen = new Set<string>();
      const items: { value: string; label: string }[] = [];
      selectedCities.forEach((city) => {
        getWardsByCity(city).forEach((w) => {
          if (!seen.has(w.value)) {
            seen.add(w.value);
            items.push({ value: w.value, label: w.label });
          }
        });
      });
      return items;
    }
    return VIETNAM_CITIES.filter((c) =>
      selectedCities.includes(c.code)
    ).flatMap((c) =>
      c.districts.map((d) => ({ value: d.name, label: d.name }))
    );
  }, [showNewAddress, selectedCities, getWardsByCity]);

  const districtLabel = showNewAddress
    ? 'Phường / Xã / Đặc khu'
    : 'Quận / Huyện';

  // District/ward names valid for a given set of cities — used to drop stale
  // selections when the city selection changes.
  const validDistrictNames = (cities: string[]): string[] =>
    showNewAddress
      ? cities.flatMap((city) => getWardsByCity(city).map((w) => w.value))
      : VIETNAM_CITIES.filter((c) => cities.includes(c.code)).flatMap((c) =>
          c.districts.map((d) => d.name)
        );

  const handleCitiesChange = (nextCities: string[]) => {
    const valid = new Set(validDistrictNames(nextCities));
    onCitiesChange(nextCities);
    onDistrictsChange(selectedDistricts.filter((d) => valid.has(d)));
  };

  return (
    <Box>
      {/* City group */}
      <Box>
        <Flex justify="space-between" align="center" mb={3}>
          <HStack gap={2}>
            <MapPin size={17} />
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="gray.700"
              _dark={{ color: 'gray.200' }}
            >
              {title}
            </Text>
          </HStack>
          {selectedCities.length > 0 && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              fontWeight="semibold"
              onClick={() => {
                onCitiesChange([]);
                onDistrictsChange([]);
              }}
            >
              <X size={14} /> <Text ml={1}>Xóa</Text>
            </Button>
          )}
        </Flex>
        <SearchableSelect
          options={sortedCityOptions}
          value={selectedCities[0] ?? ''}
          onChange={(val) => handleCitiesChange(val ? [val] : [])}
          placeholder="Chọn tỉnh / thành phố..."
          searchPlaceholder="Tìm tỉnh / thành phố..."
          dropdownZIndex={DROPDOWN_Z_INDEX}
        />
      </Box>

      {/* District / ward group */}
      {selectedCities.length > 0 && districtItems.length > 0 && (
        <Box mt={4}>
          <Flex justify="space-between" align="center" mb={3}>
            <HStack gap={2}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="gray.700"
                _dark={{ color: 'gray.200' }}
              >
                {districtLabel}
              </Text>
              {selectedDistricts.length > 0 && (
                <Badge
                  size="sm"
                  colorPalette="green"
                  variant="solid"
                  borderRadius="full"
                  px={2}
                >
                  {selectedDistricts.length}
                </Badge>
              )}
            </HStack>
            {selectedDistricts.length > 0 && (
              <Button
                size="xs"
                variant="ghost"
                colorPalette="red"
                fontWeight="semibold"
                onClick={() => onDistrictsChange([])}
              >
                <X size={14} /> <Text ml={1}>Xóa</Text>
              </Button>
            )}
          </Flex>
          <MultiSearchableSelect
            options={districtItems}
            values={selectedDistricts}
            onChange={onDistrictsChange}
            placeholder={`Chọn ${districtLabel.toLowerCase()}...`}
            searchPlaceholder={`Tìm ${districtLabel.toLowerCase()}...`}
            dropdownZIndex={DROPDOWN_Z_INDEX}
          />
        </Box>
      )}
    </Box>
  );
}

export default LocationFilterFields;
