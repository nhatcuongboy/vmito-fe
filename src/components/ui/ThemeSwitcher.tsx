'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { ChevronDown, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useColorMode } from './color-mode-provider';

export default function ThemeSwitcher() {
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

  return (
    <Box position="relative" ref={menuRef} w="full">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        w="full"
        bg="bg"
        borderColor="border"
        _hover={{ bg: 'bg.muted' }}
      >
        <Flex align="center" gap={2}>
          <currentTheme.icon size={16} />
          <Text fontSize="sm">{currentTheme.label}</Text>
        </Flex>
        <ChevronDown size={16} />
      </Button>

      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg="bg"
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          shadow="lg"
          zIndex={1000}
          overflow="hidden"
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
