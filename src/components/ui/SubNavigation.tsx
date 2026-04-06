'use client';

import { Box, Flex } from '@chakra-ui/react';
import { Link } from '@/i18n/config';
import { usePathname } from 'next/navigation';

export interface NavItem {
  label: string;
  href: string;
}

interface SubNavigationProps {
  items: NavItem[];
}

export default function SubNavigation({ items }: SubNavigationProps) {
  const pathname = usePathname();

  return (
    <Box
      w="full"
      overflowX="auto"
      overflowY="hidden"
      css={{
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <Flex gap={6} px="16px" pb={2} pt={2}>
        {items.map((item) => {
          // Normalize the paths to compare with and without locale
          const normalizedPathname = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
          const normalizedHref = item.href.replace(/^\/[a-z]{2}(\/|$)/, '/');

          let isActive = false;
          if (normalizedHref === '/') {
            isActive = normalizedPathname === '/';
          } else {
            isActive =
              normalizedPathname === normalizedHref ||
              normalizedPathname.startsWith(normalizedHref + '/');
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none' }}
            >
              <Box
                position="relative"
                color={isActive ? 'fg' : 'fg.muted'}
                fontWeight={isActive ? '600' : '500'}
                whiteSpace="nowrap"
                _hover={{ color: 'fg' }}
                transition="color 0.2s"
              >
                {item.label}
                {isActive && (
                  <Box
                    position="absolute"
                    bottom="-8px"
                    left={0}
                    right={0}
                    height="2px"
                    bg="black"
                    _dark={{ bg: 'white' }}
                    borderTopRadius="md"
                  />
                )}
              </Box>
            </Link>
          );
        })}
      </Flex>
    </Box>
  );
}
