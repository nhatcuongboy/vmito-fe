'use client';

import { Box } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

export interface NavigationTab {
  id: number;
  label: string;
  icon: LucideIcon;
}

interface BottomNavigationBarProps {
  tabs: NavigationTab[];
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
}

export default function BottomNavigationBar({
  tabs,
  activeTab,
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
      height="64px"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Box
            key={tab.id}
            as="button"
            flex={1}
            py={2}
            onClick={() => onTabChange(tab.id)}
            display="flex"
            flexDirection="column"
            alignItems="center"
            color={isActive ? 'blue.500' : 'gray.500'}
            fontWeight={isActive ? 'bold' : 'normal'}
            transition="all 0.2s"
            _hover={{
              color: 'blue.400',
              transform: 'scale(1.05)',
            }}
            _active={{
              transform: 'scale(0.95)',
            }}
          >
            <Box as={Icon} boxSize={6} mb={1} />
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}
