'use client';
import { Input } from '@/components/ui/Input';

import { Badge, Box, Flex, Portal, Text, VStack } from '@chakra-ui/react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

const normalize = (text: string): string =>
  // U+0110/U+0111 (Vietnamese D/d with stroke) has no canonical decomposition,
  // so NFD leaves it untouched. Map it to plain "d" separately, otherwise an
  // unaccented query never matches a label containing the stroked D.
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd');

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSearchableSelectProps {
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  /**
   * z-index of the portalled dropdown. Defaults to the `popover` token; pass a
   * higher value when rendered inside a high z-index overlay (e.g. a filter
   * drawer) so the dropdown is not hidden behind it.
   */
  dropdownZIndex?: number | string;
}

/**
 * Searchable multi-select with removable chips — the multi-value counterpart of
 * SearchableSelect. Selecting an option toggles it and keeps the dropdown open;
 * chosen values render as chips below the trigger. Used by the location filters
 * where a province/district list is too long for a pill grid.
 */
export const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({
  options,
  values,
  onChange,
  placeholder = 'Chọn…',
  searchPlaceholder = 'Tìm…',
  noOptionsMessage = 'Không tìm thấy kết quả',
  isDisabled = false,
  size = 'md',
  ariaLabel,
  dropdownZIndex = 'popover',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const fieldId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const safe = Array.isArray(options) ? options : [];
    if (!query.trim()) return safe;
    const q = normalize(query);
    return safe.filter((o) => normalize(o.label).includes(q));
  }, [options, query]);

  const selectedLabels = useMemo(() => {
    const safe = Array.isArray(options) ? options : [];
    const map = new Map(safe.map((o) => [o.value, o.label]));
    return values.map((v) => ({ value: v, label: map.get(v) ?? v }));
  }, [options, values]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    const onScroll = (e: Event) => {
      // Ignore scrolling inside the dropdown's own option list.
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(e.target as Node)
      ) {
        return;
      }
      // Keep the keyboard-driven scroll on touch devices from closing it.
      const isTouch =
        typeof window !== 'undefined' &&
        (window.matchMedia('(pointer: coarse)').matches ||
          'ontouchstart' in window);
      if (isTouch) return;
      close();
    };
    if (isOpen) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('touchstart', onDocClick);
      document.addEventListener('scroll', onScroll, true);
      return () => {
        document.removeEventListener('mousedown', onDocClick);
        document.removeEventListener('touchstart', onDocClick);
        document.removeEventListener('scroll', onScroll, true);
      };
    }
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleValue = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
    );
  };

  const sizeStyles =
    size === 'sm'
      ? { py: '1.5', px: '3', fontSize: 'sm' }
      : size === 'lg'
        ? { py: '3', px: '4', fontSize: 'md' }
        : { py: '2', px: '3', fontSize: 'sm' };

  const triggerRect = triggerRef.current?.getBoundingClientRect();

  return (
    <Box ref={containerRef} position="relative" width="100%">
      <Box
        ref={triggerRef}
        as="button"
        {...({ type: 'button' } as Record<string, unknown>)}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        aria-label={ariaLabel || placeholder}
        aria-expanded={isOpen}
        width="100%"
        textAlign="left"
        bg={{ base: 'white', _dark: 'gray.800' }}
        border="1px solid"
        borderColor={isOpen ? 'brand.500' : 'border'}
        borderRadius="md"
        {...sizeStyles}
        pr="10"
        position="relative"
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        _hover={{ borderColor: isDisabled ? 'border' : 'brand.500/50' }}
        display="flex"
        alignItems="center"
      >
        <Text color={values.length ? 'fg' : 'fg.muted'} truncate flex="1">
          {values.length === 0
            ? placeholder
            : values.length === 1
              ? selectedLabels[0].label
              : `Đã chọn ${values.length}`}
        </Text>
        <Box
          position="absolute"
          right="3"
          top="50%"
          color="fg.muted"
          style={{
            transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
            transition: 'transform 0.2s',
          }}
        >
          <ChevronDown size={16} aria-hidden="true" />
        </Box>
      </Box>

      {/* Selected chips */}
      {values.length > 0 && (
        <Flex gap="1.5" flexWrap="wrap" mt="2">
          {selectedLabels.map((s) => (
            <Badge
              key={s.value}
              colorPalette="green"
              variant="subtle"
              borderRadius="md"
              px="2"
              py="1"
              display="flex"
              alignItems="center"
              gap="1"
              fontSize="xs"
            >
              {s.label}
              <Box
                as="span"
                cursor="pointer"
                display="inline-flex"
                aria-label={`Bỏ ${s.label}`}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  toggleValue(s.value);
                }}
              >
                <X size={12} />
              </Box>
            </Badge>
          ))}
        </Flex>
      )}

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
            zIndex={dropdownZIndex}
            minW="200px"
            maxH="350px"
            overflow="hidden"
            style={{
              top: triggerRect ? triggerRect.bottom + 4 : 0,
              left: triggerRect ? triggerRect.left : 0,
              width: triggerRect ? triggerRect.width : 'auto',
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Escape') close();
            }}
          >
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
                >
                  <Search size={16} aria-hidden="true" />
                </Box>
                <Input
                  ref={searchInputRef}
                  id={`${fieldId}-search`}
                  name={`${fieldId}-search`}
                  autoComplete="off"
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
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

            <Box maxH="250px" overflowY="auto" p="1">
              {filtered.length === 0 ? (
                <Box p="3" textAlign="center" color="fg.muted" fontSize="sm">
                  {noOptionsMessage}
                </Box>
              ) : (
                <VStack gap="0" align="stretch">
                  {filtered.map((option) => {
                    const isSelected = values.includes(option.value);
                    return (
                      <Box
                        key={option.value}
                        as="button"
                        {...({ type: 'button' } as Record<string, unknown>)}
                        onClick={() =>
                          !option.disabled && toggleValue(option.value)
                        }
                        width="100%"
                        textAlign="left"
                        px="2"
                        py="2"
                        borderRadius="sm"
                        fontSize="sm"
                        cursor={option.disabled ? 'not-allowed' : 'pointer'}
                        opacity={option.disabled ? 0.5 : 1}
                        bg={
                          isSelected
                            ? { base: 'brand.50', _dark: 'brand.900/40' }
                            : 'transparent'
                        }
                        color={
                          isSelected
                            ? { base: 'brand.600', _dark: 'brand.300' }
                            : 'inherit'
                        }
                        _hover={{
                          bg: option.disabled
                            ? 'transparent'
                            : isSelected
                              ? { base: 'brand.100', _dark: 'brand.900/60' }
                              : 'bg.muted',
                        }}
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap="2"
                      >
                        <Text truncate flex="1">
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Check
                            size={16}
                            color="var(--chakra-colors-brand-600)"
                            style={{ flexShrink: 0 }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );
};

export default MultiSearchableSelect;
