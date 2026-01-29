'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text, Avatar, Portal } from '@chakra-ui/react';
import { ChevronDown, User as UserIcon, Monitor, MessageSquare, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTranslations } from 'next-intl';
import UserProfileModal from './UserProfileModal';

interface UserMenuProps {
  onLogout: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps) {
  const { user } = useAuthStore();
  const common = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  if (!user) return null;

  const handleProfileClick = () => {
    setIsOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <>
      <Box position="relative" ref={menuRef}>
        {/* Avatar Button */}
        <Box
          position="relative"
          cursor="pointer"
          onClick={() => setIsOpen(!isOpen)}
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
        >
          <Avatar.Root size="sm" bg="blue.500">
            <Avatar.Fallback name={user.name || user.email}>
              {(user.name || user.email).charAt(0).toUpperCase()}
            </Avatar.Fallback>
            {user.image && <Avatar.Image src={user.image} />}
          </Avatar.Root>
          {/* Dropdown Icon */}
          <Box
            position="absolute"
            bottom="-2px"
            right="-2px"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            borderRadius="full"
            p="2px"
            boxShadow="sm"
          >
            <ChevronDown size={12} />
          </Box>
        </Box>

        {/* Dropdown Menu */}
        {isOpen && (
          <Box
            position="absolute"
            top="calc(100% + 8px)"
            right={0}
            bg="white"
            borderRadius="lg"
            boxShadow="xl"
            minW="320px"
            zIndex={2000}
            border="1px solid"
            borderColor="gray.200"
            overflow="hidden"
            _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
          >
            {/* User Info Section */}
            <Box
              p={3}
              cursor="pointer"
              _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              onClick={handleProfileClick}
              borderBottom="1px solid"
              borderColor="gray.200"
              _dark={{ borderColor: 'gray.700' }}
            >
              <Flex align="center" gap={3}>
                <Avatar.Root size="md" bg="blue.500">
                  <Avatar.Fallback name={user.name || user.email}>
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                  {user.image && <Avatar.Image src={user.image} />}
                </Avatar.Root>
                <Box flex={1}>
                  <Text fontSize="md" fontWeight="semibold">
                    {user.name || 'User'}
                  </Text>
                  <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                    {user.email}
                  </Text>
                </Box>
              </Flex>
            </Box>

            {/* Menu Items */}
            <Box py={2}>
              {/* Profile/Settings */}
              <Flex
                align="center"
                gap={3}
                px={4}
                py={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                onClick={handleProfileClick}
              >
                <Box
                  bg="gray.100"
                  _dark={{ bg: 'gray.700' }}
                  p={2}
                  borderRadius="full"
                >
                  <UserIcon size={20} />
                </Box>
                <Text fontSize="md" fontWeight="medium">
                  {common('profile')}
                </Text>
              </Flex>

              {/* Display */}
              <Flex
                align="center"
                gap={3}
                px={4}
                py={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              >
                <Box
                  bg="gray.100"
                  _dark={{ bg: 'gray.700' }}
                  p={2}
                  borderRadius="full"
                >
                  <Monitor size={20} />
                </Box>
                <Text fontSize="md" fontWeight="medium">
                  Display
                </Text>
              </Flex>

              {/* Give Feedback */}
              <Flex
                align="center"
                gap={3}
                px={4}
                py={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
              >
                <Box
                  bg="gray.100"
                  _dark={{ bg: 'gray.700' }}
                  p={2}
                  borderRadius="full"
                >
                  <MessageSquare size={20} />
                </Box>
                <Text fontSize="md" fontWeight="medium">
                  {common('giveFeedback')}
                </Text>
              </Flex>

              {/* Separator */}
              <Box
                h="1px"
                bg="gray.200"
                _dark={{ bg: 'gray.700' }}
                my={2}
              />

              {/* Logout */}
              <Flex
                align="center"
                gap={3}
                px={4}
                py={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                onClick={handleLogoutClick}
              >
                <Box
                  bg="gray.100"
                  _dark={{ bg: 'gray.700' }}
                  p={2}
                  borderRadius="full"
                >
                  <LogOut size={20} />
                </Box>
                <Text fontSize="md" fontWeight="medium">
                  {common('logout')}
                </Text>
              </Flex>
            </Box>
          </Box>
        )}
      </Box>

      {/* Profile Modal - rendered via Portal to escape dropdown positioning context */}
      <Portal>
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </Portal>
    </>
  );
}
