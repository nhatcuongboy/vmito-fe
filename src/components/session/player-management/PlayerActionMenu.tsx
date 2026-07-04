import React, { useState, useRef, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { IconButton, Button, HStack } from '@/components/ui/chakra-compat';
import {
  MoreVertical,
  User,
  Edit,
  PlayCircle,
  PauseCircle,
  Trash2,
} from 'lucide-react';
import { Player } from './types';

interface PlayerActionMenuProps {
  player: Player;
  onShowQR: (p: Player) => void;
  onEdit: (p: Player) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  t: (key: string) => string;
  buttonVariant?: 'ghost' | 'solid' | 'outline' | 'subtle' | 'plain';
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg';
  onOpenChange?: (isOpen: boolean) => void;
}

export const PlayerActionMenu: React.FC<PlayerActionMenuProps> = ({
  player,
  onShowQR,
  onEdit,
  onDelete,
  onToggleStatus,
  t,
  buttonVariant = 'ghost',
  buttonSize = 'sm',
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 250px below, open upwards
      setOpenUp(spaceBelow < 250);
    }
    setIsOpen(!isOpen);
  };

  return (
    <Box position="relative" ref={menuRef}>
      <Box ref={triggerRef}>
        <IconButton
          aria-label="Options"
          icon={<MoreVertical size={16} />}
          variant={buttonVariant}
          size={buttonSize}
          color={buttonVariant === 'solid' ? 'white' : 'gray.500'}
          borderRadius="full"
          _hover={
            buttonVariant === 'solid'
              ? {
                  transform: 'scale(1.1)',
                }
              : {
                  bg: 'blackAlpha.150',
                  color: 'gray.700',
                }
          }
          transition="all 0.15s"
          onClick={handleToggle}
        />
      </Box>
      {isOpen && (
        <Box
          position="absolute"
          {...(openUp ? { bottom: '100%', mb: 2 } : { top: '100%', mt: 2 })}
          right={0}
          bg={{ base: 'white', _dark: 'gray.800' }}
          boxShadow="0 10px 40px rgba(0,0,0,0.15)"
          borderRadius="xl"
          border="1px solid"
          borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
          zIndex={100}
          minW="180px"
          overflow="hidden"
          py={2}
        >
          <Button
            variant="ghost"
            width="100%"
            justifyContent="flex-start"
            px={4}
            py={3}
            height="auto"
            onClick={(e) => {
              e.stopPropagation();
              onShowQR(player);
              setIsOpen(false);
            }}
            borderRadius={0}
            color={{ base: 'green.500', _dark: 'green.300' }}
            _hover={{
              bg: { base: 'brand.50', _dark: 'green.900/30' },
              color: { base: 'brand.600', _dark: 'green.200' },
            }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box
                p={1.5}
                bg={{ base: 'brand.100', _dark: 'green.900/50' }}
                borderRadius="md"
              >
                <User size={14} color="#3182ce" />
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                {t('viewPlayer')}
              </Text>
            </HStack>
          </Button>
          <Button
            variant="ghost"
            width="100%"
            justifyContent="flex-start"
            px={4}
            py={3}
            height="auto"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(player);
              setIsOpen(false);
            }}
            borderRadius={0}
            color={{ base: 'green.500', _dark: 'green.300' }}
            _hover={{
              bg: { base: 'purple.50', _dark: 'purple.900/30' },
              color: { base: 'purple.600', _dark: 'purple.200' },
            }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box
                p={1.5}
                bg={{ base: 'purple.100', _dark: 'purple.900/50' }}
                borderRadius="md"
              >
                <Edit size={14} color="#805ad5" />
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                {t('editPlayer')}
              </Text>
            </HStack>
          </Button>

          <Button
            variant="ghost"
            width="100%"
            justifyContent="flex-start"
            px={4}
            py={3}
            height="auto"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(player.id);
              setIsOpen(false);
            }}
            borderRadius={0}
            color={{ base: 'green.500', _dark: 'green.300' }}
            _hover={{
              bg: { base: 'orange.50', _dark: 'orange.900/30' },
              color: { base: 'orange.600', _dark: 'orange.200' },
            }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box
                p={1.5}
                bg={{ base: 'orange.100', _dark: 'orange.900/50' }}
                borderRadius="md"
              >
                {player.status === 'INACTIVE' ? (
                  <PlayCircle size={14} color="#dd6b20" />
                ) : (
                  <PauseCircle size={14} color="#dd6b20" />
                )}
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                {player.status === 'INACTIVE'
                  ? t('continuePlayer')
                  : t('pausePlayer')}
              </Text>
            </HStack>
          </Button>

          <Box
            mx={3}
            my={2}
            borderTop="1px solid"
            borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
          />
          <Button
            variant="ghost"
            width="100%"
            justifyContent="flex-start"
            px={4}
            py={3}
            height="auto"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(player.id);
              setIsOpen(false);
            }}
            borderRadius={0}
            _hover={{ bg: { base: 'red.50', _dark: 'red.900/30' } }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box
                p={1.5}
                bg={{ base: 'red.100', _dark: 'red.900/50' }}
                borderRadius="md"
              >
                <Trash2 size={14} color="#e53e3e" />
              </Box>
              <Text
                fontSize="sm"
                fontWeight="medium"
                color={{ base: 'red.500', _dark: 'red.300' }}
              >
                {t('deletePlayer')}
              </Text>
            </HStack>
          </Button>
        </Box>
      )}
    </Box>
  );
};
