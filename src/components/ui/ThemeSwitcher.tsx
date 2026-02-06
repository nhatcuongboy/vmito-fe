'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { ChevronDown, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useColorMode } from './color-mode-provider';

interface ThemeSwitcherProps {
  isCollapsed?: boolean;
}

export default function ThemeSwitcher({ isCollapsed }: ThemeSwitcherProps) {
  const common = useTranslations('common');
  const { theme, setColorMode } = useColorMode();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const themes = [
    { id: 'light', label: common('lightMode'), icon: Sun },
    { id: 'dark', label: common('darkMode'), icon: Moon },
    { id: 'system', label: common('systemMode'), icon: Monitor },
  ];

  const currentTheme = themes.find((t) => t.id === theme) || themes[2];

  const handleThemeChange = (newTheme: string) => {
    setColorMode(newTheme as 'light' | 'dark' | 'system');
    setIsOpen(false);
  };

  const handleCycleTheme = () => {
    const currentIndex = themes.findIndex((t) => t.id === theme);
    // If current theme is not found (e.g. system default at start), default to first or next appropriately?
    // Actually currentTheme handles fallback. But theme string might be 'system' which is in the list.
    // If theme is undefined, it defaults to 'system' in useColorMode probably?
    // Let's assume theme matches one of the ids.
    const safeIndex = currentIndex === -1 ? 2 : currentIndex; // default to system if unknown
    const nextIndex = (safeIndex + 1) % themes.length;
    handleThemeChange(themes[nextIndex].id);
  };

  const handleClick = () => {
    if (isCollapsed) {
      handleCycleTheme();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Box position="relative" ref={menuRef} w="full">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        display="flex"
        alignItems="center"
        justifyContent={isCollapsed ? 'center' : 'space-between'}
        gap={2}
        w="full"
        bg="bg"
        borderColor="border"
        px={isCollapsed ? 0 : 3}
        _hover={{ bg: 'bg.muted' }}
      >
        <Flex align="center" gap={2}>
          <currentTheme.icon size={16} />
          {!isCollapsed && <Text fontSize="sm">{currentTheme.label}</Text>}
        </Flex>
        {!isCollapsed && <ChevronDown size={16} />}
      </Button>

      {isOpen && !isCollapsed && (
        <Box
          position="absolute"
          bottom="100%"
          left={0}
          right={0}
          mb={2}
          bg="bg"
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          shadow="lg"
          zIndex={1000}
          overflow="hidden"
          minW="full"
        >
          {themes.map((t) => (
            <Box
              key={t.id}
              px={4}
              py={2}
              cursor="pointer"
              bg={theme === t.id ? 'bg.muted' : 'transparent'}
              _hover={{ bg: 'bg.muted' }}
              onClick={() => handleThemeChange(t.id)}
            >
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={2}>
                  <t.icon size={16} />
                  <Text fontSize="sm">{t.label}</Text>
                </Flex>
                {theme === t.id && (
                  <Check size={14} color="var(--chakra-colors-blue-500)" />
                )}
              </Flex>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
