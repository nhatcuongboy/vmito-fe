'use client';

import { Box, IconButton } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/config';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';

function getAiPageContext(pathname: string) {
  if (pathname.includes('/sessions/new')) return 'Trang tạo kèo';
  if (pathname.includes('/host/sessions'))
    return 'Trang quản lý kèo (Host Sessions)';
  if (pathname.includes('/sessions')) return 'Trang kèo';
  if (pathname.includes('/clubs')) return 'Trang câu lạc bộ';
  if (pathname.includes('/tournaments')) return 'Trang giải đấu';
  if (pathname.includes('/venues')) return 'Trang sân thể thao';
  if (pathname.includes('/user')) return 'Trang hồ sơ người dùng';
  return 'Trang chủ Vmito';
}

export default function AiAssistantTopBarButton() {
  const common = useTranslations('common');
  const pathname = usePathname();
  const open = useAiAssistantStore((state) => state.open);
  const isOpen = useAiAssistantStore((state) => state.isOpen);

  return (
    <IconButton
      aria-label={common('aiAssistant')}
      title={common('aiAssistant')}
      onClick={() => open(getAiPageContext(pathname))}
      size={{ base: 'sm', md: 'md' }}
      minW={{ base: '36px', md: '40px' }}
      h={{ base: '36px', md: '40px' }}
      borderRadius="full"
      color={isOpen ? 'white' : 'purple.600'}
      bg={isOpen ? 'purple.600' : 'purple.50'}
      border="1px solid"
      borderColor={isOpen ? 'purple.600' : 'purple.100'}
      boxShadow={isOpen ? '0 4px 12px rgba(128,90,213,0.28)' : 'none'}
      _dark={{
        color: isOpen ? 'white' : 'purple.200',
        bg: isOpen ? 'purple.500' : 'purple.950',
        borderColor: isOpen ? 'purple.500' : 'purple.800',
      }}
      _hover={{
        bg: isOpen ? 'purple.700' : 'purple.100',
        borderColor: 'purple.300',
        transform: 'translateY(-1px)',
        boxShadow: '0 6px 16px rgba(128,90,213,0.26)',
        '& .ai-topbar-sparkle': {
          animation: 'aiTopbarSparkle 0.65s ease both',
        },
      }}
      _active={{ transform: 'translateY(0) scale(0.96)' }}
      transition="all 0.2s ease"
      css={{
        '@keyframes aiTopbarSparkle': {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '35%': { transform: 'scale(1.18) rotate(-12deg)' },
          '70%': { transform: 'scale(1.08) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
      }}
    >
      <Box as="span" className="ai-topbar-sparkle" display="flex">
        <Sparkles size={18} />
      </Box>
    </IconButton>
  );
}
