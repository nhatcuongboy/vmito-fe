'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Box, Flex, Text } from '@chakra-ui/react';
import { IconButton, Button } from '@/components/ui/chakra-compat';
import { Play, RefreshCw, Square, MoreVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useRef, useEffect } from 'react';

interface SessionStatusHeaderProps {
  session: {
    name: string;
    status: string;
    startTime?: string | null;
    endTime?: string | null;
    players?: Array<{ status: string }>;
  };
  /** Read-only mode for player view - hides action menu */
  readOnly?: boolean;
  isRefreshing?: boolean;
  isToggleStatusLoading?: boolean;
  onToggleSessionStatus?: () => void;
  onRefreshData?: () => void;
  /** Top offset for sticky positioning */
  stickyTop?: any;
  mt?: any;
}

const SessionStatusHeader: React.FC<SessionStatusHeaderProps> = ({
  session,
  readOnly = false,
  isRefreshing = false,
  isToggleStatusLoading = false,
  onToggleSessionStatus,
  onRefreshData,
  stickyTop = 0,
  mt,
}) => {
  const t = useTranslations('SessionDetail');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Get status color for icons
  const getStatusBg = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return 'green.500';
      case 'IN_PROGRESS':
        return 'red.500';
      case 'FINISHED':
        return 'gray.400';
      default:
        return 'blue.500';
    }
  };

  const handleToggleStatus = () => {
    onToggleSessionStatus?.();
    setIsMenuOpen(false);
  };

  const handleRefresh = () => {
    onRefreshData?.();
    setIsMenuOpen(false);
  };

  return (
    <Box
      position="sticky"
      top={stickyTop}
      zIndex={50}
      bg="white"
      _dark={{ bg: 'gray.900', borderColor: 'gray.700' }}
      mt={mt}
      borderBottomWidth="1px"
      borderColor="gray.200"
      shadow="sm"
      py={1}
      px={4}
      minH={{ base: '40px', md: '48px' }}
      display="flex"
      alignItems="center"
    >
      <Flex align="center" justify="space-between" position="relative" w="100%">
        {/* Left spacer for centering title */}
        <Box width="40px" />

        {/* Session Name & Status - Centered */}
        <Flex
          align="center"
          justify="center"
          gap={2}
          flex={1}
          overflow="hidden"
          px={2}
        >
          <Box
            w="8px"
            h="8px"
            borderRadius="full"
            bg={getStatusBg(session.status)}
            boxShadow={`0 0 6px var(--chakra-colors-${getStatusBg(session.status).split('.')[0]}-400)`}
          />
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="gray.800"
            _dark={{ color: 'white' }}
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {session.name}
          </Text>
        </Flex>

        {/* Action Button & Dropdown - Hidden in readOnly mode */}
        {!readOnly ? (
          <Box
            width="40px"
            display="flex"
            justifyContent="flex-end"
            position="relative"
            ref={menuRef}
          >
            <IconButton
              aria-label="Actions"
              icon={<MoreVertical size={20} />}
              variant="ghost"
              size="sm"
              borderRadius="full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />

            {/* Custom Dropdown Menu */}
            {isMenuOpen && (
              <Box
                position="absolute"
                top="40px"
                right="0"
                bg="white"
                boxShadow="xl"
                borderRadius="md"
                borderWidth="1px"
                borderColor="gray.200"
                _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                py={2}
                minWidth="180px"
                zIndex={100}
              >
                {/* Play/Stop Action */}
                <Button
                  variant="ghost"
                  width="100%"
                  px={4}
                  py={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-start"
                  gap={3}
                  _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                  disabled={
                    session.status === 'FINISHED' || isToggleStatusLoading
                  }
                  onClick={handleToggleStatus}
                  opacity={
                    session.status === 'FINISHED' || isToggleStatusLoading
                      ? 0.5
                      : 1
                  }
                  cursor={
                    session.status === 'FINISHED' || isToggleStatusLoading
                      ? 'not-allowed'
                      : 'pointer'
                  }
                  fontWeight="normal"
                  borderRadius="0"
                >
                  <Box
                    as={session.status === 'IN_PROGRESS' ? Square : Play}
                    boxSize={4}
                    color={getStatusBg(session.status)}
                  />
                  <Text fontSize="sm" fontWeight="medium">
                    {session.status === 'IN_PROGRESS' ? t('end') : t('start')}
                  </Text>
                </Button>

                {/* Refresh Action */}
                {session.status === 'IN_PROGRESS' && (
                  <Button
                    variant="ghost"
                    width="100%"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                    justifyContent="flex-start"
                    gap={3}
                    _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }}
                    disabled={isRefreshing}
                    onClick={handleRefresh}
                    opacity={isRefreshing ? 0.5 : 1}
                    cursor={isRefreshing ? 'not-allowed' : 'pointer'}
                    fontWeight="normal"
                    borderRadius="0"
                  >
                    <Box as={RefreshCw} boxSize={4} color="blue.500" />
                    <Text fontSize="sm" fontWeight="medium">
                      {t('refresh')}
                    </Text>
                  </Button>
                )}
              </Box>
            )}
          </Box>
        ) : (
          /* Right spacer for centering title in readOnly mode */
          <Box width="40px" />
        )}
      </Flex>
    </Box>
  );
};

export default SessionStatusHeader;
