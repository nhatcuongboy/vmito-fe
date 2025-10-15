'use client';

import SessionsList from '@/components/session/SessionsList';
import { NextLinkButton } from '@/components/ui/NextLinkButton';
import TopBar from '@/components/ui/TopBar';
import ProtectedRouteGuard from '@/components/guards/ProtectedRouteGuard';
import { Box, Container, Flex, Heading } from '@chakra-ui/react';
import { Calendar, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function HostPage() {
  const t = useTranslations('pages.host');

  return (
    <ProtectedRouteGuard requiredRole={['HOST']}>
      <Box minH="100vh">
        {/* Top Bar */}
        <TopBar title="Host" />

        {/* Main Content */}
        <Container maxW="container.xl" py={16} mt={10}>
          {/* Sessions Section */}
          <Box mb={10}>
            <Flex mb={4} justify="space-between" align="center">
              <Heading as="h2" size="xl" textAlign="left">
                {t('upcomingSessions')}
              </Heading>
              <Flex gap={4}>
                <NextLinkButton
                  href="/host/sessions/new"
                  colorScheme="blue"
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4" /> {t('createNewSession')}
                </NextLinkButton>
                <NextLinkButton
                  href="/host/sessions"
                  colorScheme="purple"
                  variant="outline"
                  size="lg"
                >
                  <Calendar className="mr-2 h-4 w-4" /> {t('manageSessions')}
                </NextLinkButton>
              </Flex>
            </Flex>
            <SessionsList status="UPCOMING_AND_INPROGRESS" />
          </Box>
        </Container>
      </Box>
    </ProtectedRouteGuard>
  );
}
