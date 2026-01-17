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
        mt={{
          base: 'calc(44px + env(safe-area-inset-top))',
          md: 'calc(56px + env(safe-area-inset-top))',
        }}
        height={{
          base: 'calc(100vh - 44px - env(safe-area-inset-top))',
          md: 'calc(100vh - 56px - env(safe-area-inset-top))',
        }}
        overflowY="auto"
        p={contentPadding}
      >
        {children}
      </Box>
    </Box>
  );
}
