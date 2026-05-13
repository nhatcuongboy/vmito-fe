'use client';

import { Flex, Box, Badge } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { PlayerService } from '@/lib/api/player.service';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/chakra-compat';
import { UnderlineTabs } from '../ui/UnderlineTabs';

export interface StatusTabSwitchProps {
  activeTab: 'active' | 'ended' | 'pending' | 'expired';
  onChange: (tab: 'active' | 'ended' | 'pending' | 'expired') => void;
  activeLabel?: string;
  endedLabel?: string;
  pendingLabel?: string;
  showPending?: boolean;
  showExpired?: boolean;
  isFixed?: boolean;
  pendingCount?: number;
}

export function StatusTabSwitch({
  activeTab,
  onChange,
  activeLabel,
  endedLabel,
  pendingLabel,
  showPending = true,
  showExpired = true,
  isFixed: _isFixed = false,
  pendingCount: initialPendingCount,
}: StatusTabSwitchProps) {
  const tSession = useTranslations('session');
  const tNav = useTranslations('navigation');
  const [pendingCount, setPendingCount] = useState<number | undefined>(
    initialPendingCount
  );

  useEffect(() => {
    if (initialPendingCount !== undefined) {
      setPendingCount(initialPendingCount);
      return;
    }

    const fetchCount = async () => {
      try {
        const count = await PlayerService.getPendingRequestsCount();
        setPendingCount(count);
      } catch (error) {
        console.error('Error fetching pending requests count:', error);
      }
    };

    fetchCount();
  }, [initialPendingCount]);

  const defaultActiveLabel = tSession('activeSessions');
  const defaultEndedLabel = tNav('endedSessions');
  const defaultPendingLabel = tNav('pendingJoinRequests');
  const defaultExpiredLabel = tSession('expiredSessions');

  const tabs = [
    { id: 'active', label: activeLabel || defaultActiveLabel },
    { id: 'ended', label: endedLabel || defaultEndedLabel },
    ...(showExpired ? [{ id: 'expired', label: defaultExpiredLabel }] : []),
    ...(showPending
      ? [
          {
            id: 'pending',
            label: pendingLabel || defaultPendingLabel,
            badge: pendingCount && pendingCount > 0 ? pendingCount : undefined,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* MOBILE VIEW: Underline style using shared component */}
      <Box display={{ base: 'block', md: 'none' }} w="100%">
        <UnderlineTabs
          items={tabs}
          activeId={activeTab}
          onTabClick={(id) => onChange(id as StatusTabSwitchProps['activeTab'])}
        />
      </Box>

      {/* DESKTOP VIEW: Pill style, part of flow */}
      <Flex
        display={{ base: 'none', md: 'flex' }}
        bg="gray.100"
        p={1}
        borderRadius="full"
        _dark={{
          bg: 'whiteAlpha.200',
        }}
        w="max-content"
        mx="auto"
        gap={1}
        mb={1}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              h="36px"
              px={6}
              size="sm"
              borderRadius="full"
              bg={active ? 'white' : 'transparent'}
              color={active ? 'gray.900' : 'gray.500'}
              fontWeight={active ? '600' : '500'}
              boxShadow={active ? 'sm' : 'none'}
              onClick={() =>
                onChange(tab.id as StatusTabSwitchProps['activeTab'])
              }
              transition="all 0.2s"
              _hover={{
                bg: active ? 'white' : 'gray.200',
              }}
              _dark={{
                bg: active ? 'gray.600' : 'transparent',
                color: active ? 'white' : 'gray.300',
                _hover: {
                  bg: active ? 'gray.600' : 'whiteAlpha.300',
                },
              }}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge !== null && (
                <Badge
                  ml={2}
                  borderRadius="full"
                  variant="solid"
                  colorPalette="red"
                  fontSize="2xs"
                  size="sm"
                  minW="18px"
                  px={1}
                >
                  {tab.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </Flex>
    </>
  );
}
