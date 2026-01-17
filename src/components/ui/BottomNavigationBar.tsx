'use client';

import { Box, Spinner } from '@chakra-ui/react';
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
      bg="white"
      borderTopWidth="1px"
      boxShadow="md"
      display="flex"
      justifyContent="space-around"
      alignItems="center"
      height="calc(64px + env(safe-area-inset-bottom) + 8px)"
      paddingBottom="calc(env(safe-area-inset-bottom) + 8px)"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isLoading = loadingTabId === tab.id;

        return (
          <Box
            key={tab.id}
            as="button"
            flex={1}
            py={{ base: 1, md: 2 }}
            onClick={() => !isLoading && onTabChange(tab.id)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={isActive ? 'blue.600' : 'gray.500'}
            fontWeight={isActive ? 'bold' : 'normal'}
            fontSize={{ base: '10px', md: 'xs' }}
            transition="all 0.2s"
            _hover={{
              color: isActive ? 'blue.700' : 'blue.400',
              transform: !isLoading ? 'scale(1.05)' : 'none',
            }}
            _active={{
              transform: !isLoading ? 'scale(0.95)' : 'none',
            }}
            cursor={isLoading ? 'not-allowed' : 'pointer'}
            opacity={isLoading ? 0.7 : 1}
          >
            {isLoading ? (
              <Spinner
                size="sm"
                color="blue.500"
                mb={{ base: 0.5, md: 1 }}
              />
            ) : (
              <Box
                as={Icon}
                boxSize={{ base: 5, md: 6 }}
                mb={{ base: 0.5, md: 1 }}
              />
            )}
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}
