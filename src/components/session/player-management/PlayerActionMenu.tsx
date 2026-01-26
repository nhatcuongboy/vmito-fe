import React, { useState, useRef, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { IconButton, Button, HStack, VStack } from '@/components/ui/chakra-compat';
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
  buttonVariant?: any;
  buttonSize?: any;
  onOpenChange?: (isOpen: boolean) => void;
}

export const PlayerActionMenu: React.FC<PlayerActionMenuProps> = ({
  player,
  onShowQR,
  onEdit,
  onDelete,
  onToggleStatus,
  t,
  buttonVariant = "ghost",
  buttonSize = "sm",
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
          icon={<MoreVertical size={18} />}
          variant={buttonVariant}
          size={buttonSize}
          color={buttonVariant === 'solid' ? 'white' : 'gray.400'}
          borderRadius="full"
          _hover={buttonVariant === 'solid' ? {
             transform: 'scale(1.1)',
          } : {
            bg: 'gray.100',
            color: 'gray.600',
            transform: 'scale(1.1)',
          }}
          transition="all 0.2s"
          onClick={handleToggle}
        />
      </Box>
      {isOpen && (
        <Box
          position="absolute"
          {...(openUp ? { bottom: '100%', mb: 2 } : { top: '100%', mt: 2 })}
          right={0}
          bg="white"
          boxShadow="0 10px 40px rgba(0,0,0,0.15)"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.100"
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
            _hover={{ bg: 'blue.50', color: 'blue.600' }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box p={1.5} bg="blue.100" borderRadius="md">
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
            _hover={{ bg: 'purple.50', color: 'purple.600' }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box p={1.5} bg="purple.100" borderRadius="md">
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
            _hover={{ bg: 'orange.50', color: 'orange.600' }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box p={1.5} bg="orange.100" borderRadius="md">
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

          <Box mx={3} my={2} borderTop="1px solid" borderColor="gray.100" />
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
            _hover={{ bg: 'red.50' }}
            transition="all 0.2s"
          >
            <HStack spacing={3}>
              <Box p={1.5} bg="red.100" borderRadius="md">
                <Trash2 size={14} color="#e53e3e" />
              </Box>
              <Text fontSize="sm" fontWeight="medium" color="red.500">
                {t('deletePlayer')}
              </Text>
            </HStack>
          </Button>
        </Box>
      )}
    </Box>
  );
};
