'use client';

import { Box, Spinner, Text } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { LucideIcon, Plus } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '@/constants';

export interface NavigationTab {
  id: number;
  label: string;
  icon: LucideIcon;
  href?: string;
  dataTour?: string;
}

export interface CenterAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
  dataTour?: string;
}

interface BottomNavigationBarProps {
  tabs: NavigationTab[];
  activeTab: number;
  loadingTabId?: number | null;
  onTabChange: (tabIndex: number) => void;
  bottomOffset?: string | Record<string, string>;
  alwaysVisible?: boolean;
  centerAction?: CenterAction;
}

export default function BottomNavigationBar({
  tabs,
  activeTab,
  loadingTabId,
  onTabChange,
  bottomOffset,
  alwaysVisible,
  centerAction,
}: BottomNavigationBarProps) {
  const { isCollapsed } = useSidebar();
  const shouldClusterCenterTabs = centerAction && tabs.length === 2;

  const leftTabs = centerAction
    ? tabs.slice(0, Math.floor(tabs.length / 2))
    : tabs;
  const rightTabs = centerAction ? tabs.slice(Math.floor(tabs.length / 2)) : [];

  const renderTab = (tab: NavigationTab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    const isLoading = loadingTabId === tab.id;

    return (
      <Box key={tab.id} position="relative" flex={1} minW={0}>
        {isActive && (
          <Box
            position="absolute"
            top="-2px"
            left="8px"
            right="8px"
            h="3px"
            borderRadius="full"
            bg="brand.500"
          />
        )}
        <Button
          data-tour={tab.dataTour}
          onClick={() => !isLoading && onTabChange(tab.id)}
          variant="ghost"
          width="100%"
          height="100%"
          py={2}
          px={1}
          flexDirection="column"
          gap={0.5}
          color={isActive ? 'brand.500' : 'fg.muted'}
          bg="transparent"
          _active={{
            bg: 'transparent',
          }}
          _hover={{
            bg: { base: 'gray.50', _dark: 'rgba(34, 197, 94, 0.1)' },
            color: { base: 'brand.600', _dark: 'brand.400' },
          }}
          display="flex"
          alignItems="center"
          cursor={isLoading ? 'not-allowed' : 'pointer'}
          opacity={isLoading ? 0.7 : 1}
        >
          {isLoading ? (
            <Spinner size="sm" color="brand.500" mb={{ base: 0.5, md: 1 }} />
          ) : (
            <Icon
              size={20}
              style={{
                color: isActive
                  ? 'var(--chakra-colors-brand-500)'
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
      </Box>
    );
  };

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
      zIndex={1000}
      bg={{ base: 'white', _dark: 'rgba(10, 23, 37, 0.94)' }}
      borderTopWidth="1px"
      borderTopColor={{
        base: 'border',
        _dark: 'var(--tournament-border, var(--chakra-colors-border))',
      }}
      boxShadow={{
        base: 'sm',
        _dark: '0 -16px 40px rgba(0, 0, 0, 0.32)',
      }}
      display={alwaysVisible ? 'flex' : { base: 'flex', md: 'none' }}
      justifyContent="center"
      alignItems="center"
      height="calc(64px + var(--bottom-nav-safe-area, env(safe-area-inset-bottom)))"
      paddingBottom="var(--bottom-nav-safe-area, env(safe-area-inset-bottom))"
      transition="left 0.3s ease"
      overflow="visible"
    >
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        w="100%"
        maxW={shouldClusterCenterTabs ? '320px' : 'none'}
        h="100%"
        overflow="visible"
      >
        {leftTabs.map(renderTab)}

        {centerAction && (
          <Box
            flex={1}
            minW={0}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-end"
            pb="6px"
            position="relative"
          >
            <Box
              as="button"
              data-tour={centerAction.dataTour}
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap="2px"
              cursor={centerAction.loading ? 'not-allowed' : 'pointer'}
              transform="translateY(-16px)"
              _hover={{
                transform: centerAction.loading
                  ? 'translateY(-16px)'
                  : 'translateY(-18px)',
              }}
              _active={{ transform: 'translateY(-14px) scale(0.95)' }}
              transition="transform 0.15s ease"
              onClick={!centerAction.loading ? centerAction.onClick : undefined}
              aria-label={centerAction.label}
              opacity={centerAction.loading ? 0.7 : 1}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxSize="52px"
                borderRadius="full"
                bg="green.500"
                color="white"
                boxShadow="0 -2px 8px rgba(23, 154, 59, 0.4), 0 4px 14px rgba(23, 154, 59, 0.35)"
              >
                {centerAction.loading ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <Plus size={24} />
                )}
              </Box>
              <Text
                fontSize="2xs"
                fontWeight="bold"
                color="green.600"
                _dark={{ color: 'green.400' }}
                textAlign="center"
              >
                {centerAction.label}
              </Text>
            </Box>
          </Box>
        )}

        {rightTabs.map(renderTab)}
      </Box>
    </Box>
  );
}
