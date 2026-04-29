'use client';
import { Input } from '@/components/ui/Input';

import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { Box, Portal, Text, VStack } from '@chakra-ui/react';
import { Search, ChevronDown, Check } from 'lucide-react';

/**
 * SearchableSelect Option Interface
 */
export interface SearchableSelectOption {
  value: string;
  label: string;
  /**
   * Optional secondary line shown below the label (e.g. address for venue options)
   */
  sublabel?: string;
  disabled?: boolean;
}

/**
 * Props for SearchableSelect component
 */
export interface SearchableVSelectProps {
  /**
   * Array of options to display
   */
  options: SearchableSelectOption[];
  /**
   * Current selected value
   */
  value?: string;
  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void;
  /**
   * Placeholder text when no option is selected
   */
  placeholder?: string;
  /**
   * Placeholder for search input
   */
  searchPlaceholder?: string;
  /**
   * Message when no options found
   */
  noOptionsMessage?: string;
  /**
   * Whether the select is disabled
   */
  isDisabled?: boolean;
  /**
   * Size of the component
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether the select is invalid
   */
  isInvalid?: boolean;
  /**
   * Called when search query changes — enables server-side search.
   * When provided, internal filtering is skipped (options are used as-is).
   */
  onSearchChange?: (query: string) => void;
  /**
   * Show loading indicator in the dropdown (for async search)
   */
  isLoading?: boolean;
}

/**
 * SearchableSelect - A custom select component with search functionality
 * Uses Popover pattern to avoid zag-js state machine conflicts
 */
export const SearchableSelect: React.FC<SearchableVSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  noOptionsMessage = 'No options found',
  isDisabled = false,
  size = 'md',
  isInvalid = false,
  onSearchChange,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize Vietnamese characters for fuzzy search
  const normalizeVietnamese = (text: string): string => {
    // Remove diacritics using NFD (Canonical Decomposition)
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Fuzzy search function with scoring (supports Vietnamese)
  const fuzzyMatch = (
    text: string,
    query: string
  ): { matches: boolean; score: number } => {
    const textNormalized = normalizeVietnamese(text).toLowerCase();
    const queryNormalized = normalizeVietnamese(query).toLowerCase();
    const textLower = text.toLowerCase();

    let textIndex = 0;
    let queryIndex = 0;
    let score = 0;
    let consecutiveMatches = 0;

    while (
      textIndex < textNormalized.length &&
      queryIndex < queryNormalized.length
    ) {
      if (textNormalized[textIndex] === queryNormalized[queryIndex]) {
        // Award points for matches
        score += 1;

        // Bonus points for consecutive matches
        consecutiveMatches++;
        if (consecutiveMatches > 1) {
          score += consecutiveMatches * 2;
        }

        // Bonus points for matching at the start
        if (queryIndex === 0 && textIndex === 0) {
          score += 10;
        }

        // Bonus points for matching after a space (word boundary)
        if (textIndex > 0 && textNormalized[textIndex - 1] === ' ') {
          score += 5;
        }

        queryIndex++;
      } else {
        consecutiveMatches = 0;
      }
      textIndex++;
    }

    // All query characters must be found in order
    const matches = queryIndex === queryNormalized.length;

    // Penalize based on length difference
    if (matches) {
      const lengthDiff = textNormalized.length - queryNormalized.length;
      score -= lengthDiff * 0.5;
    }

    return { matches, score };
  };

  // Notify parent of search query changes (for server-side search)
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      onSearchChange?.(query);
    },
    [onSearchChange]
  );

  // Filter and sort options based on fuzzy search query
  const filteredOptions = useMemo(() => {
    // Ensure options is always an array
    const safeOptions = Array.isArray(options) ? options : [];

    // When server-side search is enabled, skip client-side filtering
    if (onSearchChange) {
      return safeOptions;
    }

    if (!searchQuery.trim()) {
      return safeOptions;
    }

    const query = searchQuery.trim();

    // Map options with their match scores
    const scoredOptions = safeOptions
      .map((option) => {
        const labelResult = fuzzyMatch(String(option.label || ''), query);
        const sublabelResult = option.sublabel
          ? fuzzyMatch(String(option.sublabel), query)
          : { matches: false, score: 0 };
        const matches = labelResult.matches || sublabelResult.matches;
        // Use the higher score; sublabel matches get a slight penalty to prefer label matches
        const score = labelResult.matches
          ? labelResult.score
          : sublabelResult.score * 0.8;
        return {
          option,
          matches,
          score,
        };
      })
      .filter((item) => item.matches)
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .map((item) => item.option);

    return scoredOptions;
  }, [options, searchQuery, onSearchChange]);

  // Cache the selected option so we can still show its label if it disappears from options (e.g., async search cleared)
  const [cachedSelectedOption, setCachedSelectedOption] =
    useState<SearchableSelectOption | null>(null);

  useEffect(() => {
    if (value) {
      const safeOptions = Array.isArray(options) ? options : [];
      const selected = safeOptions.find((opt) => opt.value === value);
      if (selected) {
        setCachedSelectedOption(selected);
      }
    } else {
      setCachedSelectedOption(null);
    }
  }, [value, options]);

  // Find selected option label
  const selectedLabel = useMemo(() => {
    const safeOptions = Array.isArray(options) ? options : [];
    const selected =
      safeOptions.find((opt) => opt.value === value) ||
      (cachedSelectedOption?.value === value ? cachedSelectedOption : null);
    return selected?.label || '';
  }, [options, value, cachedSelectedOption]);

  // Close dropdown and reset search state (including parent's server-side search)
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    onSearchChange?.('');
  }, [onSearchChange]);

  // Handle click outside and scroll to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleScroll = (event: Event) => {
      // On mobile/touch devices, opening the keyboard often triggers a scroll event.
      // We should ignore scroll events on touch devices to prevent the dropdown from closing immediately.
      const isTouchDevice =
        typeof window !== 'undefined' &&
        (window.matchMedia('(pointer: coarse)').matches ||
          'ontouchstart' in window);
      if (isTouchDevice) {
        return;
      }

      // Close unless the scroll is inside the dropdown itself
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(event.target as Node)
      ) {
        return;
      }
      closeDropdown();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen, closeDropdown]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle option select
  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    closeDropdown();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  };

  // Get size-based styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { py: '1.5', px: '3', fontSize: 'sm' };
      case 'lg':
        return { py: '3', px: '4', fontSize: 'md' };
      default:
        return { py: '2', px: '3', fontSize: 'sm' };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Box ref={containerRef} position="relative" width="100%">
      {/* Trigger Button */}
      <Box
        as="button"
        {...({ type: 'button' } as any)}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        width="100%"
        textAlign="left"
        bg={{ base: 'white', _dark: 'gray.800' }}
        border="1px solid"
        borderColor={
          isInvalid ? 'border.error' : isOpen ? 'brand.500' : 'border'
        }
        borderRadius="md"
        {...sizeStyles}
        pr="10"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        _hover={{
          borderColor: isInvalid
            ? 'border.error'
            : isDisabled
              ? 'border'
              : 'brand.500/50',
        }}
        _focus={{
          outline: 'none',
          borderColor: isInvalid ? 'border.error' : 'brand.500',
          boxShadow: isInvalid
            ? '0 0 0 1px var(--chakra-colors-border-error)'
            : '0 0 0 1px var(--chakra-colors-brand-500)',
        }}
        transition="all 0.2s"
        display="flex"
        alignItems="center"
      >
        <Text color={selectedLabel ? 'fg' : 'fg.muted'} truncate flex="1">
          {selectedLabel || placeholder}
        </Text>
        <Box
          position="absolute"
          right="3"
          top="50%"
          transform="translateY(-50%)"
          color="fg.muted"
          transition="transform 0.2s"
          style={{
            transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
          }}
        >
          <ChevronDown size={16} />
        </Box>
      </Box>

      {/* Dropdown */}
      {isOpen && (
        <Portal>
          <Box
            ref={dropdownRef}
            position="fixed"
            bg={{ base: 'white', _dark: 'gray.800' }}
            boxShadow="lg"
            borderRadius="md"
            borderWidth="1px"
            borderColor="border"
            zIndex="popover"
            minW="200px"
            maxH="350px"
            overflow="hidden"
            style={{
              top: containerRef.current
                ? containerRef.current.getBoundingClientRect().bottom + 4
                : 0,
              left: containerRef.current
                ? containerRef.current.getBoundingClientRect().left
                : 0,
              width: containerRef.current
                ? containerRef.current.getBoundingClientRect().width
                : 'auto',
            }}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input */}
            <Box
              p="2"
              borderBottomWidth="1px"
              borderColor="border"
              position="sticky"
              top="0"
              bg={{ base: 'white', _dark: 'gray.800' }}
              zIndex="1"
            >
              <Box position="relative" onClick={(e) => e.stopPropagation()}>
                <Box
                  position="absolute"
                  left="3"
                  top="50%"
                  transform="translateY(-50%)"
                  color={{ base: 'gray.500', _dark: 'gray.400' }}
                  pointerEvents="none"
                  zIndex="2"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Search size={16} />
                </Box>
                <Input
                  ref={searchInputRef}
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  size="sm"
                  pl="9"
                  bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }}
                  border="1px solid"
                  borderColor="border"
                  _focus={{
                    bg: { base: 'white', _dark: 'gray.700' },
                    borderColor: 'brand.500',
                    boxShadow: 'none',
                  }}
                />
              </Box>
            </Box>

            {/* Options List */}
            <Box maxH="250px" overflowY="auto" p="1">
              {isLoading ? (
                <Box p="3" textAlign="center" color="fg.muted" fontSize="sm">
                  ...
                </Box>
              ) : filteredOptions.length === 0 ? (
                <Box p="3" textAlign="center" color="fg.muted" fontSize="sm">
                  {noOptionsMessage}
                </Box>
              ) : (
                <VStack gap="0" align="stretch">
                  {filteredOptions.map((option) => (
                    <Box
                      key={option.value}
                      as="button"
                      {...({ type: 'button' } as any)}
                      onClick={() =>
                        !option.disabled && handleSelect(option.value)
                      }
                      width="100%"
                      textAlign="left"
                      px="2"
                      py={option.sublabel ? '1.5' : '2'}
                      borderRadius="sm"
                      fontSize="sm"
                      cursor={option.disabled ? 'not-allowed' : 'pointer'}
                      opacity={option.disabled ? 0.5 : 1}
                      bg={
                        option.value === value
                          ? { base: 'brand.50', _dark: 'brand.900/40' }
                          : 'transparent'
                      }
                      color={
                        option.value === value
                          ? { base: 'brand.600', _dark: 'brand.300' }
                          : 'inherit'
                      }
                      _hover={{
                        bg: option.disabled
                          ? 'transparent'
                          : option.value === value
                            ? { base: 'brand.100', _dark: 'brand.900/60' }
                            : 'bg.muted',
                      }}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap="2"
                    >
                      <Box flex="1" overflow="hidden">
                        <Text
                          truncate
                          fontWeight={option.sublabel ? 'medium' : 'normal'}
                        >
                          {option.label}
                        </Text>
                        {option.sublabel && (
                          <Text
                            truncate
                            fontSize="xs"
                            color="fg.muted"
                            mt="0.5"
                          >
                            {option.sublabel}
                          </Text>
                        )}
                      </Box>
                      {option.value === value && (
                        <Check
                          size={16}
                          color="var(--chakra-colors-brand-600)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );
};

export default SearchableSelect;
