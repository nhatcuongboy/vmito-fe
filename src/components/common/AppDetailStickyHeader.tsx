'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { Box, Flex, Heading, Image, Icon, Portal } from '@chakra-ui/react';
import { ChevronLeft, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/chakra-compat';
import { TOP_BAR_HEIGHT_MOBILE } from '@/constants';

interface AppDetailStickyHeaderProps {
  title?: string;
  onBack?: () => void;
  rightContent?: ReactNode;
  /** Show the compact Vmito wordmark beneath the title on venue details. */
  showBrand?: boolean;
  onShare?: () => void;
  shareLabel?: string;
}

/**
 * Compact header for mobile detail pages that hide the TopBar behind a
 * full-bleed hero. Render it right after the hero: the sentinel it drops in the
 * flow decides when the hero has scrolled away and the header takes over.
 */
const AppDetailStickyHeader = ({
  title,
  onBack,
  rightContent,
  showBrand = false,
  onShare,
  shareLabel,
}: AppDetailStickyHeaderProps) => {
  const tCommon = useTranslations('common');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPinned(entry.boundingClientRect.top <= 0),
      { threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Box ref={sentinelRef} aria-hidden h="1px" mt="-1px" />
      <Portal>
        <Flex
          display={{ base: 'flex', md: 'none' }}
          position="fixed"
          top={0}
          left={0}
          right={0}
          zIndex={90}
          align="center"
          gap={2}
          px={2}
          h={`${TOP_BAR_HEIGHT_MOBILE}px`}
          pt="env(safe-area-inset-top)"
          boxSizing="content-box"
          bg="white"
          _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
          borderBottomWidth="0.5px"
          borderBottomColor="gray.100"
          boxShadow="0 1px 3px rgba(0, 0, 0, 0.06)"
          opacity={isPinned ? 1 : 0}
          pointerEvents={isPinned ? 'auto' : 'none'}
          transition="background-color 0.2s ease, opacity 0.2s ease"
        >
          {onBack && (
            <IconButton
              aria-label={tCommon('back')}
              variant="ghost"
              size="sm"
              borderRadius="full"
              onClick={onBack}
              icon={<ChevronLeft size={22} strokeWidth={2.5} />}
            />
          )}
          <Box flex="1" minW={0}>
            <Heading size="sm" lineClamp={1} lineHeight="shorter">
              {title}
            </Heading>
            {showBrand ? (
              <Flex
                align="center"
                gap={1}
                mt={0.5}
                color="green.600"
                _dark={{ color: 'green.300' }}
              >
                <Image
                  src="/icons/app-logo-96.png"
                  alt=""
                  aria-hidden="true"
                  boxSize="16px"
                  borderRadius="md"
                />
                <Box
                  as="span"
                  fontSize="xs"
                  fontWeight="bold"
                  lineHeight="1"
                  translate="no"
                >
                  Vmito
                </Box>
              </Flex>
            ) : null}
          </Box>
          <Flex align="center" gap={1} flexShrink={0}>
            {onShare ? (
              <IconButton
                aria-label={shareLabel ?? 'Share'}
                variant="ghost"
                size="sm"
                minW="40px"
                h="40px"
                borderRadius="full"
                touchAction="manipulation"
                onClick={onShare}
                icon={<Icon as={Share2} boxSize={4.5} aria-hidden="true" />}
              />
            ) : null}
            {rightContent}
          </Flex>
        </Flex>
      </Portal>
    </>
  );
};

export default AppDetailStickyHeader;
