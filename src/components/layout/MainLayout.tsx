'use client';

import { Box, Flex } from '@chakra-ui/react';
import Footer from './Footer';
import TopBar from '@/components/ui/TopBar';
import {
  TOP_BAR_HEIGHT,
  TOP_BAR_HEIGHT_MOBILE,
  TOP_BAR_HEIGHT_DESKTOP,
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from '@/constants';
import { ReactNode } from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  backgroundColor?: any;
  contentPadding?: number | string;
  centerTitle?: boolean;
}

export default function MainLayout({
  children,
  title,
  showBackButton = false,
  backHref = '/',
  backgroundColor = { base: 'green.50', _dark: 'gray.950' },
  contentPadding = 0,
  centerTitle = false,
}: MainLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <Box
      position="fixed"
      top={0}
      left={{
        base: 0,
        md: isCollapsed
          ? `${SIDEBAR_WIDTH_COLLAPSED}px`
          : `${SIDEBAR_WIDTH_EXPANDED}px`,
      }}
      right={0}
      bottom={0}
      bg={backgroundColor}
      overflow="hidden"
      transition="left 0.3s ease"
    >
      <TopBar
        title={title}
        showBackButton={showBackButton}
        backHref={backHref}
        centerTitle={centerTitle}
      />
      <Box
        mt={{
          base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
          md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
        }}
        height={{
          base: `calc(100% - ${TOP_BAR_HEIGHT_MOBILE}px - env(safe-area-inset-top))`,
          md: `calc(100% - ${TOP_BAR_HEIGHT_DESKTOP}px - env(safe-area-inset-top))`,
        }}
        overflowY="auto"
        bg={backgroundColor}
      >
        <Flex direction="column" minH="100%">
          <Box flex="1" p={contentPadding}>
            {children}
          </Box>
          {/* <Footer /> */}
        </Flex>
      </Box>
    </Box>
  );
}
