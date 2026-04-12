'use client';

import { Box, Spinner, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '@/constants';

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
  bottomOffset?: string | Record<string, string>;
  alwaysVisible?: boolean;
}

export default function BottomNavigationBar({
  tabs,
  activeTab,
  loadingTabId,
  onTabChange,
  bottomOffset,
  alwaysVisible,
}: BottomNavigationBarProps) {
  const { isCollapsed } = useSidebar();

  return (
    <Box
      position="fixed"
      left={{
        base: 0,
        md: isCollapsed
          ? `${SIDEBAR_WIDTH_COLLAPSED}px`
          : `${SIDEBAR_WIDTH_EXPANDED}px`,
      }}
      right={0}
      bottom={bottomOffset ?? 0}
      zIndex={100}
      bg={{ base: 'white', _dark: 'gray.800' }}
      borderTopWidth="1px"
      borderTopColor="border"
      boxShadow="sm"
      display={alwaysVisible ? 'flex' : { base: 'flex', md: 'none' }}
      justifyContent="space-around"
      alignItems="center"
      height="calc(64px + env(safe-area-inset-bottom))"
      paddingBottom="env(safe-area-inset-bottom)"
      transition="left 0.3s ease"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isLoading = loadingTabId === tab.id;

        return (
          <Box key={tab.id} position="relative" flex={1} minW={0}>
            <Button
              onClick={() => !isLoading && onTabChange(tab.id)}
              variant="ghost"
              width="100%"
              height="100%"
              py={2}
              px={1}
              flexDirection="column"
              gap={0.5}
              color={isActive ? 'green.500' : 'fg.muted'}
              bg="transparent"
              _active={{
                bg: 'transparent',
              }}
              _hover={{
                bg: { base: 'gray.50', _dark: 'gray.800' },
                color: { base: 'green.600', _dark: 'green.400' },
              }}
              display="flex"
              alignItems="center"
              cursor={isLoading ? 'not-allowed' : 'pointer'}
              opacity={isLoading ? 0.7 : 1}
            >
              {isLoading ? (
                <Spinner
                  size="sm"
                  color="green.500"
                  mb={{ base: 0.5, md: 1 }}
                />
              ) : (
                <Icon
                  size={20}
                  style={{
                    color: isActive
                      ? 'var(--chakra-colors-green-500)'
                      : 'currentColor',
                  }}
                />
              )}
              <Text
                fontSize={{ base: '2xs', sm: 'xs' }}
                fontWeight={isActive ? 'semibold' : 'medium'}
                lineClamp={1}
                textAlign="center"
                px={0.5}
              >
                {tab.label}
              </Text>
            </Button>
            {/* Active indicator bar */}
          </Box>
        );
      })}
    </Box>
  );
}
