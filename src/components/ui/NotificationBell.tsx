'use client';

import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Mock data type
interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  isRead: boolean;
  time: string;
}

// Mock data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Match Ready',
    message: 'Your match on Court 2 is ready to start.',
    type: 'success',
    isRead: false,
    time: '2 min ago',
  },
  {
    id: '2',
    title: 'Session Update',
    message: 'Host has changed the session time to 18:00.',
    type: 'info',
    isRead: false,
    time: '15 min ago',
  },
  {
    id: '3',
    title: 'Payment Reminder',
    message: 'Please complete your payment for the previous session.',
    type: 'warning',
    isRead: true,
    time: '1 hour ago',
  },
];

// ... imports

interface NotificationBellProps {
  color?: string;
  _hover?: any;
}

export default function NotificationBell({
  color,
  _hover,
}: NotificationBellProps) {
  //   const tCommon = useTranslations('common');
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} color="var(--chakra-colors-green-500)" />;
      case 'warning':
        return (
          <AlertTriangle size={16} color="var(--chakra-colors-orange-500)" />
        );
      case 'info':
      default:
        return <Info size={16} color="var(--chakra-colors-blue-500)" />;
    }
  };

  return (
    <>
      {/* Overlay for verify click outside */}
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1300}
          onClick={() => setIsOpen(false)}
        />
      )}

      <Box position="relative" display="inline-block" zIndex={1301}>
        <IconButton
          aria-label="Notifications"
          variant="ghost"
          size="md"
          borderRadius="full"
          color={color}
          _hover={
            _hover || { bg: 'gray.100', _dark: { bg: 'gray.700' } }
          }
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell size={20} />
        </IconButton>

        {unreadCount > 0 && (
          <Box
            position="absolute"
            top={2}
            right={2}
            width="8px"
            height="8px"
            bg="red.500"
            borderRadius="full"
            border="2px solid white"
            _dark={{ borderColor: 'gray.800' }}
            pointerEvents="none"
          />
        )}

        {/* Dropdown Content */}
        {isOpen && (
          <Box
            position="absolute"
            top="100%"
            right="-60px"
            mt={2}
            width="320px"
            maxW="90vw"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            boxShadow="xl"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.100"
            overflow="hidden"
            animation="fade-in 0.2s"
          >
            {/* Header */}
            <Flex
              justify="space-between"
              align="center"
              p={3}
              borderBottomWidth="1px"
              borderColor="gray.100"
              _dark={{ borderColor: 'gray.700' }}
            >
              <Heading size="sm" fontSize="sm">
                Notifications
              </Heading>
              <Flex gap={2}>
                {unreadCount > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={handleMarkAllAsRead}
                    fontSize="xs"
                    h="24px"
                  >
                    <Check size={14} style={{ marginRight: '4px' }} />
                    Mark all read
                  </Button>
                )}
              </Flex>
            </Flex>

            {/* List */}
            <Box maxH="400px" overflowY="auto">
              {notifications.length === 0 ? (
                <Box p={6} textAlign="center" color="gray.500">
                  <Text fontSize="sm">No notifications</Text>
                </Box>
              ) : (
                <Stack gap={0}>
                  {notifications.map((notification) => (
                    <Box
                      key={notification.id}
                      as="button"
                      onClick={() => handleNotificationClick(notification.id)}
                      w="100%"
                      textAlign="left"
                      p={3}
                      bg={notification.isRead ? 'transparent' : 'blue.50'}
                      _dark={{
                        bg: notification.isRead
                          ? 'transparent'
                          : 'whiteAlpha.100',
                        borderColor: 'gray.700',
                      }}
                      borderBottomWidth="1px"
                      borderColor="gray.50"
                      _last={{ borderBottomWidth: 0 }}
                      transition="all 0.2s"
                      _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                    >
                      <Flex gap={3} align="start">
                        <Box mt={1} minW="16px">
                          {getIcon(notification.type)}
                        </Box>
                        <Box flex={1}>
                          <Text
                            fontSize="sm"
                            fontWeight={notification.isRead ? 'medium' : 'bold'}
                            lineHeight="short"
                            mb={1}
                          >
                            {notification.title}
                          </Text>
                          <Text
                            fontSize="xs"
                            color="gray.600"
                            _dark={{ color: 'gray.300' }}
                            lineHeight="shorter"
                            lineClamp={2}
                            mb={1}
                          >
                            {notification.message}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            {notification.time}
                          </Text>
                        </Box>
                        {!notification.isRead && (
                          <Box
                            w="6px"
                            h="6px"
                            bg="blue.500"
                            borderRadius="full"
                            mt={1}
                          />
                        )}
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}
