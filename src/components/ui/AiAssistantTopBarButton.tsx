'use client';

import { Box, IconButton } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/config';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';
import { getAiAssistantPageContextKey } from '@/components/ai/aiAssistantSuggestions';

export default function AiAssistantTopBarButton() {
  const common = useTranslations('common');
  const t = useTranslations('aiAssistant');
  const pathname = usePathname();
  const open = useAiAssistantStore((state) => state.open);
  const isOpen = useAiAssistantStore((state) => state.isOpen);

  return (
    <IconButton
      aria-label={common('aiAssistant')}
      title={common('aiAssistant')}
      onClick={() =>
        open(t(`pageContexts.${getAiAssistantPageContextKey(pathname)}`))
      }
      display={{ base: 'none', md: 'inline-flex' }}
      size={{ base: 'sm', md: 'md' }}
      minW={{ base: '36px', md: '40px' }}
      h={{ base: '36px', md: '40px' }}
      borderRadius="full"
      color="purple.600"
      bg={isOpen ? 'purple.50' : 'gray.100'}
      border="1px solid"
      borderColor={isOpen ? 'purple.200' : 'gray.200'}
      boxShadow="sm"
      _dark={{
        color: 'purple.200',
        bg: isOpen ? 'purple.950' : 'gray.800',
        borderColor: isOpen ? 'purple.800' : 'gray.700',
      }}
      _hover={{
        bg: isOpen ? 'purple.100' : 'gray.200',
        borderColor: isOpen ? 'purple.300' : 'gray.300',
        transform: 'translateY(-1px)',
        boxShadow: isOpen
          ? '0 4px 12px rgba(128,90,213,0.15)'
          : '0 4px 12px rgba(0,0,0,0.08)',
        _dark: {
          bg: isOpen ? 'purple.900' : 'gray.700',
          borderColor: isOpen ? 'purple.700' : 'gray.600',
          boxShadow: 'none',
        },
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
