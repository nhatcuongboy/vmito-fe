'use client';

import { Flex } from '@chakra-ui/react';
import { Button } from '../ui/chakra-compat';
import { useTranslations } from 'next-intl';

export interface StatusTabSwitchProps {
  activeTab: 'active' | 'ended';
  onChange: (tab: 'active' | 'ended') => void;
  activeLabel?: string;
  endedLabel?: string;
}

export function StatusTabSwitch({
  activeTab,
  onChange,
  activeLabel,
  endedLabel,
}: StatusTabSwitchProps) {
  const tSession = useTranslations('session');
  const tNav = useTranslations('navigation');

  const defaultActiveLabel = tSession('activeSessions');
  const defaultEndedLabel = tNav('endedSessions');

  return (
    <Flex
      bg="gray.200"
      _dark={{ bg: 'whiteAlpha.200' }}
      borderRadius="full"
      p="4px"
      w="100%"
      maxW="340px"
      mx="auto"
    >
      <Button
        flex={1}
        variant="ghost"
        h="30px"
        size="sm"
        borderRadius="full"
        bg={activeTab === 'active' ? 'white' : 'transparent'}
        color={activeTab === 'active' ? 'gray.900' : 'gray.500'}
        fontWeight={activeTab === 'active' ? '600' : '500'}
        boxShadow={activeTab === 'active' ? 'sm' : 'none'}
        onClick={() => onChange('active')}
        transition="all 0.2s"
        _hover={{
          bg: activeTab === 'active' ? 'white' : 'gray.300',
        }}
        _dark={{
          bg: activeTab === 'active' ? 'gray.700' : 'transparent',
          color: activeTab === 'active' ? 'white' : 'whiteAlpha.600',
          _hover: {
            bg: activeTab === 'active' ? 'gray.700' : 'whiteAlpha.300',
          },
        }}
      >
        {activeLabel || defaultActiveLabel}
      </Button>

      <Button
        flex={1}
        variant="ghost"
        h="30px"
        size="sm"
        borderRadius="full"
        bg={activeTab === 'ended' ? 'white' : 'transparent'}
        color={activeTab === 'ended' ? 'gray.900' : 'gray.500'}
        fontWeight={activeTab === 'ended' ? '600' : '500'}
        boxShadow={activeTab === 'ended' ? 'sm' : 'none'}
        onClick={() => onChange('ended')}
        transition="all 0.2s"
        _hover={{
          bg: activeTab === 'ended' ? 'white' : 'gray.300',
        }}
        _dark={{
          bg: activeTab === 'ended' ? 'gray.700' : 'transparent',
          color: activeTab === 'ended' ? 'white' : 'whiteAlpha.600',
          _hover: { bg: activeTab === 'ended' ? 'gray.700' : 'whiteAlpha.300' },
        }}
      >
        {endedLabel || defaultEndedLabel}
      </Button>
    </Flex>
  );
}
