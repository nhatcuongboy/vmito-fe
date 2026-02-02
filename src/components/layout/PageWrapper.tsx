'use client';

import { Box, BoxProps } from '@chakra-ui/react';
import { useSidebar } from '@/contexts/SidebarContext';
import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from '@/constants';
import { ReactNode } from 'react';

interface PageWrapperProps extends BoxProps {
  children: ReactNode;
}

/**
 * PageWrapper component that automatically handles sidebar offset on desktop.
 * Use this as the root wrapper for pages that need to account for the fixed sidebar.
 */
export default function PageWrapper({ children, ...props }: PageWrapperProps) {
  const { isCollapsed } = useSidebar();

  return (
    <Box
      minH="100vh"
      ml={{
        base: 0,
        md: isCollapsed
          ? `${SIDEBAR_WIDTH_COLLAPSED}px`
          : `${SIDEBAR_WIDTH_EXPANDED}px`,
      }}
      transition="margin-left 0.3s ease"
      {...props}
    >
      {children}
    </Box>
  );
}
