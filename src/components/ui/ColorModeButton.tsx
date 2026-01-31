'use client';

import { IconButton } from '@chakra-ui/react';
import { Moon, Sun } from 'lucide-react';
import { useColorMode } from './color-mode-provider';

interface ColorModeButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
}

export const ColorModeButton = ({
  size = 'md',
  variant = 'ghost',
}: ColorModeButtonProps) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label={
        colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      }
      onClick={toggleColorMode}
      variant={variant}
      size={size}
      _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100' }}
    >
      {colorMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </IconButton>
  );
};

export default ColorModeButton;
