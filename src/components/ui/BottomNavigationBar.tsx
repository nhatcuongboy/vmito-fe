'use client';

import { Box, Spinner, Button, Text } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

export interface NavigationTab {
  id: number;
  label: string;
  icon: LucideIcon;
  href?: string;
}

interface BottomNavigationBarProps {
  tabs: NavigationTab[];
  activeTab: number;
  loadingTabId?: number | null;
  onTabChange: (tabIndex: number) => void;
}

export default function BottomNavigationBar({
  tabs,
  activeTab,
  loadingTabId,
  onTabChange,
}: BottomNavigationBarProps) {
  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom={0}
      zIndex={100}
      bg={{ base: "white", _dark: "gray.800" }}
      borderTopWidth="1px"
      borderTopColor="border"
      boxShadow="sm"
      display="flex"
      justifyContent="space-around"
      alignItems="center"
      height="calc(64px + env(safe-area-inset-bottom))"
      paddingBottom="env(safe-area-inset-bottom)"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isLoading = loadingTabId === tab.id;

        return (
          <Button
            key={tab.id}
            onClick={() => !isLoading && onTabChange(tab.id)}
            variant="ghost"
            width="100%"
            height="100%"
            py={2}
            borderRadius={0}
            flexDirection="column"
            gap={1}
            color={isActive ? 'blue.500' : 'fg.muted'}
            _active={{ bg: 'transparent' }}
            _hover={{ bg: 'transparent', color: { base: 'blue.600', _dark: 'blue.400' } }}
            flex={1}
            display="flex"
            alignItems="center"
            cursor={isLoading ? 'not-allowed' : 'pointer'}
            opacity={isLoading ? 0.7 : 1}
          >
            {isLoading ? (
              <Spinner size="sm" color="blue.500" mb={{ base: 0.5, md: 1 }} />
            ) : (
              <Icon
                size={20}
                style={{
                  color: isActive
                    ? 'var(--chakra-colors-blue-500)'
                    : 'currentColor',
                }}
              />
            )}
            <Text fontSize="xs" fontWeight={isActive ? 'semibold' : 'medium'}>
              {tab.label}
            </Text>
          </Button>
        );
      })}
    </Box>
  );
}
