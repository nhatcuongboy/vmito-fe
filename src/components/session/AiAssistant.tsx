'use client';

import { useAiAssistantStore } from '@/stores/useAiAssistantStore';
import AiAssistantPanel from '@/components/ai/AiAssistantPanel';
import { usePathname } from '@/i18n/config';
import { Box, Portal } from '@chakra-ui/react';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getAiAssistantPageContextKey } from '@/components/ai/aiAssistantSuggestions';

interface AiAssistantProps {
  /** Optional bottom offset for the float button (e.g. to avoid bottom nav) */
  bottomOffset?: string | Record<string, string>;
  /** Optional session/page context passed to AI */
  pageContext?: string;
  /** Render the legacy float trigger button. The panel is always mounted. */
  showTrigger?: boolean;
}

export default function AiAssistant({
  bottomOffset = '80px',
  pageContext,
  showTrigger = true,
}: AiAssistantProps) {
  const {
    isOpen,
    close,
    toggle,
    pageContext: storeContext,
  } = useAiAssistantStore();
  const pathname = usePathname();
  const t = useTranslations('aiAssistant');
  const routeContext = t(
    `pageContexts.${getAiAssistantPageContextKey(pathname)}`
  );

  // Auto-generate page context from pathname if not provided
  const resolvedContext = pageContext ?? storeContext ?? routeContext;

  return (
    <>
      {showTrigger && (
        <Portal>
          <Box
            position="fixed"
            bottom={bottomOffset}
            right="20px"
            zIndex={isOpen ? 1201 : 1000}
            opacity={isOpen ? 0 : 1}
            transform={
              isOpen ? 'scale(0.5) rotate(90deg)' : 'scale(1) rotate(0deg)'
            }
            pointerEvents={isOpen ? 'none' : 'auto'}
            transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          >
            <Box
              as="button"
              onClick={() => toggle(pageContext ?? routeContext)}
              w={{ base: '44px', md: '52px' }}
              h={{ base: '44px', md: '52px' }}
              borderRadius="full"
              bgGradient="to-br"
              gradientFrom="purple.500"
              gradientTo="purple.700"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow={
                isOpen
                  ? '0 0 0 3px rgba(128,90,213,0.4), 0 4px 20px rgba(128,90,213,0.5)'
                  : '0 4px 14px rgba(128,90,213,0.45)'
              }
              _hover={{
                transform: 'scale(1.08)',
                boxShadow: '0 6px 20px rgba(128,90,213,0.55)',
              }}
              _active={{ transform: 'scale(0.95)' }}
              transition="all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
              aria-label={t('open')}
              title={t('title')}
            >
              <span
                style={{
                  display: 'flex',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <Sparkles size={20} />
              </span>

              {!isOpen && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="full"
                  border="2px solid"
                  borderColor="purple.400"
                  animation="pingOnce 2s ease-out infinite"
                  css={{
                    '@keyframes pingOnce': {
                      '0%': { transform: 'scale(1)', opacity: 0.6 },
                      '70%': { transform: 'scale(1.4)', opacity: 0 },
                      '100%': { transform: 'scale(1.4)', opacity: 0 },
                    },
                  }}
                />
              )}
            </Box>
          </Box>
        </Portal>
      )}

      {/* AI Chat Panel */}
      <AiAssistantPanel
        isOpen={isOpen}
        onClose={close}
        pageContext={resolvedContext}
      />
    </>
  );
}
