'use client';

import { VIETNAM_CITIES } from '@/constants/vietnam-locations';
import { usePreferenceStore } from '@/stores/usePreferenceStore';
import { Box, Flex, Portal, Text } from '@chakra-ui/react';
import { Check, ChevronDown, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function CitySelector() {
  const preferredCity = usePreferenceStore((s) => s.preferredCity);
  const setPreferredCity = usePreferenceStore((s) => s.setPreferredCity);

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedCity = VIETNAM_CITIES.find((c) => c.code === preferredCity);

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

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 190;
      const padding = 16;
      let left = rect.left;
      if (left + menuWidth > window.innerWidth - padding) {
        left = window.innerWidth - menuWidth - padding;
      }
      setDropdownPos({ top: rect.bottom + 6, left });
    }
    setIsOpen(true);
  };

  const handleSelect = (code: string) => {
    setPreferredCity(code);
    setIsOpen(false);
  };

  return (
    <>
      <Flex
        ref={buttonRef}
        align="center"
        gap={1}
        /* Mobile: icon-only pill; desktop: wider pill with text */
        px={{ base: 1.5, md: 2.5 }}
        py={1}
        borderRadius="full"
        border="1px solid"
        borderColor={isOpen ? 'green.400' : 'green.300'}
        bg={isOpen ? 'green.100' : 'green.50'}
        _dark={{
          borderColor: isOpen ? 'green.500' : 'green.700',
          bg: isOpen ? 'green.900' : 'green.950',
        }}
        cursor="pointer"
        _hover={{
          borderColor: 'green.400',
          bg: 'green.100',
          _dark: { borderColor: 'green.500', bg: 'green.900' },
        }}
        onClick={handleToggle}
        userSelect="none"
        transition="all 0.15s"
      >
        <MapPin
          size={15}
          color={
            isOpen
              ? 'var(--chakra-colors-green-700)'
              : 'var(--chakra-colors-green-600)'
          }
        />

        {/* Short text for mobile */}
        <Text
          display={{ base: 'block', md: 'none' }}
          fontSize="sm"
          fontWeight="600"
          maxW="80px"
          overflow="hidden"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          color={isOpen ? 'green.800' : 'green.700'}
          _dark={{ color: isOpen ? 'green.200' : 'green.300' }}
        >
          {selectedCity?.shortName ?? selectedCity?.name ?? 'Chọn TP'}
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
          color={isOpen ? 'green.800' : 'green.700'}
          _dark={{ color: isOpen ? 'green.200' : 'green.300' }}
        >
          {selectedCity?.name ?? 'Chọn thành phố'}
        </Text>
        <Box display="block">
          <ChevronDown
            size={12}
            color={
              isOpen
                ? 'var(--chakra-colors-green-600)'
                : 'var(--chakra-colors-green-500)'
            }
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
            minW="190px"
            py={1}
            overflow="hidden"
          >
            {VIETNAM_CITIES.map((city) => {
              const isSelected = city.code === preferredCity;
              return (
                <Flex
                  key={city.code}
                  align="center"
                  justify="space-between"
                  px={4}
                  py={2.5}
                  cursor="pointer"
                  bg={isSelected ? 'green.50' : 'transparent'}
                  _hover={{ bg: isSelected ? 'green.50' : 'bg.muted' }}
                  _dark={{
                    bg: isSelected ? 'green.950' : 'transparent',
                    _hover: { bg: isSelected ? 'green.950' : 'whiteAlpha.100' },
                  }}
                  onClick={() => handleSelect(city.code)}
                  transition="background 0.1s"
                >
                  <Text
                    fontSize="sm"
                    fontWeight={isSelected ? '600' : '400'}
                    color={isSelected ? 'green.700' : 'fg'}
                    _dark={{ color: isSelected ? 'green.300' : 'fg' }}
                  >
                    {city.name}
                  </Text>
                  {isSelected && (
                    <Check size={14} color="var(--chakra-colors-green-500)" />
                  )}
                </Flex>
              );
            })}
          </Box>
        </Portal>
      )}
    </>
  );
}
