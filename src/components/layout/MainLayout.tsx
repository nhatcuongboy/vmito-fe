import { Box } from '@chakra-ui/react';
import TopBar from '@/components/ui/TopBar';
import { TOP_BAR_HEIGHT } from '@/constants';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  backgroundColor?: string;
  contentPadding?: number | string;
}

export default function MainLayout({
  children,
  title,
  showBackButton = false,
  backHref = '/',
  backgroundColor = 'gray.50',
  contentPadding = 0,
}: MainLayoutProps) {
  return (
    <Box height="100vh" bg={backgroundColor}>
      <TopBar
        title={title}
        showBackButton={showBackButton}
        backHref={backHref}
      />
      <Box
        mt={`${TOP_BAR_HEIGHT}px`}
        height={`calc(100vh - ${TOP_BAR_HEIGHT}px)`}
        overflowY="auto"
        p={contentPadding}
      >
        {children}
      </Box>
    </Box>
  );
}
