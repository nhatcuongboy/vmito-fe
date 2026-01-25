import { Box, Flex } from '@chakra-ui/react';
import Footer from './Footer';
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
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg={backgroundColor}
      overflow="hidden"
    >
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
          base: 'calc(100% - 44px - env(safe-area-inset-top))',
          md: 'calc(100% - 56px - env(safe-area-inset-top))',
        }}
        overflowY="auto"
        bg={backgroundColor}
      >
        <Flex direction="column" minH="100%">
          <Box flex="1" p={contentPadding}>
            {children}
          </Box>
          <Footer />
        </Flex>
      </Box>
    </Box>
  );
}
