'use client';

import { Box, Image, Portal, Link } from '@chakra-ui/react';
import { usePathname } from '@/i18n/config';

// Mirrors the AI button's hidden routes — no need for support CTAs there
const HIDDEN_PATHS = ['/auth', '/admin', '/guest', '/join'];

const ZALO_URL = 'https://zalo.me/84914810765';
const MESSENGER_URL = 'https://m.me/vmitovn';

export default function FloatingContactButtons() {
  const pathname = usePathname();
  const normalized =
    pathname?.replace(/^\/[a-z]{2}(\/|$)/, '/').replace(/\/$/, '') || '/';

  if (HIDDEN_PATHS.some((path) => normalized.startsWith(path))) return null;

  return (
    <Portal>
      {/* Desktop only — mobile already has the bottom nav + AI button for reach.
          Right side: the left column is the desktop nav sidebar (z-index 1250). */}
      <Box
        display={{ base: 'none', md: 'flex' }}
        flexDir="column"
        gap={3}
        position="fixed"
        right="20px"
        bottom="24px"
        zIndex={1300}
      >
        <Link
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Zalo"
          title="Nhắn Zalo"
          w="52px"
          h="52px"
          borderRadius="full"
          bg="#0068FF"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 4px 14px rgba(0,104,255,0.45)"
          _hover={{
            transform: 'scale(1.08)',
            boxShadow: '0 6px 20px rgba(0,104,255,0.55)',
          }}
          _active={{ transform: 'scale(0.95)' }}
          transition="all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
        >
          <Image src="/icons/zalo-32.png" alt="Zalo" boxSize="32px" />
        </Link>

        <Link
          href={MESSENGER_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Messenger"
          title="Nhắn Messenger"
          w="52px"
          h="52px"
          borderRadius="full"
          bg="#0084FF"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow="0 4px 14px rgba(0,132,255,0.45)"
          _hover={{
            transform: 'scale(1.08)',
            boxShadow: '0 6px 20px rgba(0,132,255,0.55)',
          }}
          _active={{ transform: 'scale(0.95)' }}
          transition="all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.371 0 0 5.007 0 11.184c0 3.517 1.798 6.61 4.578 8.628V24l4.248-2.331c1.073.288 2.198.451 3.174.451 6.629 0 12-5.007 12-11.184C24 5.007 18.629 0 12 0zm1.191 15.093l-3.055-3.26-5.963 3.26L10.732 8l3.13 3.259L19.752 8l-6.561 7.093z" />
          </svg>
        </Link>
      </Box>
    </Portal>
  );
}
