'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Box, Flex, Text, Portal } from '@chakra-ui/react';
import { ChevronDown, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Multi-Select Option Interface
 */
export interface VMultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Props for VMultiSelect component
 */
export interface VMultiSelectProps {
  /**
   * Array of selected values
   */
  value?: string[];
  /**
   * onChange handler - receives array of selected values
   */
  onChange?: (values: string[]) => void;
  /**
   * Options to display
   */
  options: VMultiSelectOption[];
  /**
   * Placeholder text when no option is selected
   */
  placeholder?: string;
  /**
   * Size of the select component
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /**
   * Variant of the select component
   */
  variant?: 'outline' | 'subtle';
  /**
   * Disabled state
   */
  isDisabled?: boolean;
  /**
   * Width of the component
   */
  width?: string | Record<string, string>;
  /**
   * Show clear all button
   */
  showClearAll?: boolean;
  /**
   * Custom render function for dropdown items
   */
  renderItem?: (option: VMultiSelectOption) => React.ReactNode;
  /**
   * Custom render function for selected values display
   */
  renderSelected?: (options: VMultiSelectOption[]) => React.ReactNode;
}

/**
 * VMultiSelect - Multi-select dropdown component
 *
 * @example
 * ```tsx
 * <VMultiSelect
 *   value={selectedValues}
 *   onChange={setSelectedValues}
 *   options={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2' },
 *   ]}
 *   placeholder="Select options"
 * />
 * ```
 */
export const VMultiSelect = ({
  value = [],
  onChange,
  options,
  placeholder = 'Select...',
  size = 'md',
  variant = 'outline',
  isDisabled = false,
  width,
  showClearAll = true,
  renderItem,
  renderSelected,
}: VMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get selected labels
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  const selectedDisplay = useMemo(() => {
    if (renderSelected) {
      const result = renderSelected(selectedOptions);
      // If result is a string, return it
      if (typeof result === 'string') return result;
      return result;
    }

    // Default: show count if more than 2 selected
    if (selectedOptions.length === 0) return null;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    if (selectedOptions.length === 2) {
      return `${selectedOptions[0].label}, ${selectedOptions[1].label}`;
    }
    return `${selectedOptions.length} selected`;
  }, [selectedOptions, renderSelected]);

  // Handle option toggle
  const handleToggle = (optionValue: string) => {
    if (isDisabled) return;

    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];

    onChange?.(newValue);
  };

  // Handle clear all
  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.([]);
  };

  // Get padding based on size
  const getPadding = () => {
    switch (size) {
      case 'xs':
        return '0.25rem 0.5rem';
      case 'sm':
        return '0.375rem 0.625rem';
      case 'lg':
        return '0.75rem 1rem';
      default:
        return '0.5rem 0.75rem';
    }
  };

  // Get font size based on size
  const getFontSize = () => {
    switch (size) {
      case 'xs':
        return '0.75rem';
      case 'sm':
        return '0.875rem';
      case 'lg':
        return '1rem';
      default:
        return '0.875rem';
    }
  };

  return (
    <Box position="relative" width={width} ref={containerRef}>
      {/* Trigger */}
      <Flex
        align="center"
        justify="space-between"
        padding={getPadding()}
        fontSize={getFontSize()}
        borderRadius="md"
        borderWidth={variant === 'outline' ? '1px' : '0'}
        borderColor="border"
        bg={variant === 'subtle' ? 'bg.subtle' : 'bg'}
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        opacity={isDisabled ? 0.5 : 1}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        _hover={
          !isDisabled
            ? {
                borderColor: 'brand.500',
              }
            : undefined
        }
        _focusVisible={{
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        }}
        tabIndex={isDisabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isDisabled) {
              setIsOpen(!isOpen);
            }
          }
        }}
      >
        <Flex align="center" gap={1} flex={1} overflow="hidden">
          {selectedOptions.length === 0 ? (
            <Text color="fg.muted" fontSize={getFontSize()} whiteSpace="nowrap">
              {placeholder}
            </Text>
          ) : (
            <Text
              fontSize={getFontSize()}
              lineClamp={1}
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {selectedDisplay}
            </Text>
          )}
        </Flex>

        <Flex align="center" gap={1} ml={2}>
          {showClearAll && selectedOptions.length > 0 && !isDisabled && (
            <Box
              as="button"
              {...({ type: 'button' } as Record<string, unknown>)}
              aria-label="Clear selected options"
              onClick={handleClearAll}
              p={1}
              borderRadius="sm"
              _hover={{ bg: 'gray.100', _dark: { bg: 'whiteAlpha.200' } }}
              display="flex"
              alignItems="center"
            >
              <X size={14} />
            </Box>
          )}
          <ChevronDown
            size={16}
            style={{
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </Flex>
      </Flex>

      {/* Dropdown */}
      {isOpen && (
        <Portal>
          <Box
            ref={dropdownRef}
            position="fixed"
            top={
              containerRef.current
                ? `${containerRef.current.getBoundingClientRect().bottom + 4}px`
                : '0'
            }
            left={
              containerRef.current
                ? `${containerRef.current.getBoundingClientRect().left}px`
                : '0'
            }
            width={
              containerRef.current
                ? `${containerRef.current.getBoundingClientRect().width}px`
                : 'auto'
            }
            bg={{ base: 'white', _dark: 'gray.800' }}
            boxShadow="lg"
            borderRadius="md"
            borderWidth="1px"
            borderColor="border"
            p="1"
            maxH="300px"
            overflowY="auto"
            zIndex="popover"
          >
            {options.map((option) => (
              <Flex
                key={option.value}
                align="center"
                gap={2}
                p="2"
                borderRadius="sm"
                cursor={option.disabled ? 'not-allowed' : 'pointer'}
                opacity={option.disabled ? 0.5 : 1}
                _hover={
                  !option.disabled
                    ? { bg: { base: 'gray.50', _dark: 'whiteAlpha.50' } }
                    : undefined
                }
                onClick={() => !option.disabled && handleToggle(option.value)}
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  disabled={option.disabled}
                  pointerEvents="none"
                />
                {renderItem ? (
                  renderItem(option)
                ) : (
                  <Text fontSize="sm">{option.label}</Text>
                )}
              </Flex>
            ))}
          </Box>
        </Portal>
      )}
    </Box>
  );
};

VMultiSelect.displayName = 'VMultiSelect';

export default VMultiSelect;
