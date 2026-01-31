'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    Box,
    Input,
    Portal,
    Text,
    VStack,
} from '@chakra-ui/react';
import { Search, ChevronDown, Check } from 'lucide-react';

/**
 * SearchableSelect Option Interface
 */
export interface SearchableSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

/**
 * Props for SearchableSelect component
 */
export interface SearchableSelectProps {
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
}

/**
 * SearchableSelect - A custom select component with search functionality
 * Uses Popover pattern to avoid zag-js state machine conflicts
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    noOptionsMessage = 'No options found',
    isDisabled = false,
    size = 'md',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) {
            return options;
        }
        const query = searchQuery.toLowerCase().trim();
        return options.filter((option) =>
            String(option.label || '').toLowerCase().includes(query)
        );
    }, [options, searchQuery]);

    // Find selected option label
    const selectedLabel = useMemo(() => {
        const selected = options.find((opt) => opt.value === value);
        return selected?.label || '';
    }, [options, value]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

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
        setIsOpen(false);
        setSearchQuery('');
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchQuery('');
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
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                width="100%"
                textAlign="left"
                bg="white"
                border="1px solid"
                borderColor={isOpen ? 'blue.500' : 'gray.200'}
                borderRadius="md"
                {...sizeStyles}
                pr="10"
                cursor={isDisabled ? 'not-allowed' : 'pointer'}
                opacity={isDisabled ? 0.5 : 1}
                _hover={{ borderColor: isDisabled ? 'gray.200' : 'gray.300' }}
                _focus={{ outline: 'none', borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
            >
                <Text
                    color={selectedLabel ? 'inherit' : 'gray.500'}
                    truncate
                    flex="1"
                >
                    {selectedLabel || placeholder}
                </Text>
                <Box
                    position="absolute"
                    right="3"
                    top="50%"
                    transform="translateY(-50%)"
                    color="gray.400"
                    transition="transform 0.2s"
                    style={{ transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)` }}
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
                        bg="white"
                        boxShadow="lg"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
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
                            borderColor="gray.200"
                            position="sticky"
                            top="0"
                            bg="white"
                            zIndex="1"
                        >
                            <Box position="relative">
                                <Box
                                    position="absolute"
                                    left="3"
                                    top="50%"
                                    transform="translateY(-50%)"
                                    color="gray.400"
                                    pointerEvents="none"
                                >
                                    <Search size={16} />
                                </Box>
                                <Input
                                    ref={searchInputRef}
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    size="sm"
                                    pl="9"
                                    bg="gray.50"
                                    border="1px solid"
                                    borderColor="gray.200"
                                    _focus={{
                                        bg: 'white',
                                        borderColor: 'blue.500',
                                        boxShadow: 'none',
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Options List */}
                        <Box maxH="250px" overflowY="auto" p="1">
                            {filteredOptions.length === 0 ? (
                                <Box p="3" textAlign="center" color="gray.500" fontSize="sm">
                                    {noOptionsMessage}
                                </Box>
                            ) : (
                                <VStack gap="0" align="stretch">
                                    {filteredOptions.map((option) => (
                                        <Box
                                            key={option.value}
                                            as="button"
                                            onClick={() => !option.disabled && handleSelect(option.value)}
                                            width="100%"
                                            textAlign="left"
                                            p="2"
                                            borderRadius="sm"
                                            fontSize="sm"
                                            cursor={option.disabled ? 'not-allowed' : 'pointer'}
                                            opacity={option.disabled ? 0.5 : 1}
                                            bg={option.value === value ? 'blue.50' : 'transparent'}
                                            color={option.value === value ? 'blue.600' : 'inherit'}
                                            _hover={{
                                                bg: option.disabled
                                                    ? 'transparent'
                                                    : option.value === value
                                                        ? 'blue.100'
                                                        : 'gray.50',
                                            }}
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            <Text truncate>{option.label}</Text>
                                            {option.value === value && (
                                                <Check size={16} color="var(--chakra-colors-blue-600)" />
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
