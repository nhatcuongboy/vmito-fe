'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useTranslations } from 'next-intl';
import { Box, Flex } from '@chakra-ui/react';
import { Shield, Users } from 'lucide-react';
import { useRouter } from '@/i18n/config';
import { usePathname } from '@/i18n/config';
import ClubsNavPanel from '@/components/clubs/ClubsNavPanel';

export default function MyClubsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();

  const normalizedPathname = pathname
    ?.replace(/^\/[a-z]{2}(\/|$)/, '/')
    .replace(/\/$/, '');
  const activeTab =
    normalizedPathname === '/my-clubs/member' ? 'member' : 'managing';

  const handleTabChange = (tab: 'managing' | 'member') => {
    const route = tab === 'member' ? '/my-clubs/member' : '/my-clubs/managing';
    router.push(route);
  };

  return (
    <PageLayout
      title={activeTab === 'member' ? t('joinedGroups') : t('manageGroups')}
      showBackButton={false}
    >
      {/* Desktop pill tab switcher */}
      <Flex
        display={{ base: 'none', md: 'flex' }}
        bg="gray.100"
        _dark={{ bg: 'whiteAlpha.100' }}
        p={1}
        borderRadius="full"
        w="max-content"
        mx="auto"
        gap={1}
        mb={6}
      >
        {(
          [
            { key: 'managing', label: t('manageGroups'), icon: Shield },
            { key: 'member', label: t('joinedGroups'), icon: Users },
          ] as const
        ).map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <Box
              key={key}
              as="button"
              onClick={() => handleTabChange(key)}
              h="36px"
              px={6}
              borderRadius="full"
              bg={active ? 'white' : 'transparent'}
              _dark={{
                bg: active ? 'gray.700' : 'transparent',
                color: active ? 'white' : 'gray.400',
              }}
              color={active ? 'gray.900' : 'gray.500'}
              fontWeight={active ? '600' : '500'}
              fontSize="sm"
              boxShadow={active ? 'sm' : 'none'}
              transition="all 0.2s"
              display="flex"
              alignItems="center"
              gap={2}
              cursor="pointer"
            >
              <Icon size={15} />
              {label}
            </Box>
          );
        })}
      </Flex>

      {children}

      <ClubsNavPanel activeTab={activeTab} onTabChange={handleTabChange} />
    </PageLayout>
  );
}
