'use client';

import { Box, Badge, Tabs, Text } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';

export interface DetailSubMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: LucideIcon;
  badge?: number | string;
}

interface DetailSubMenuProps {
  items: DetailSubMenuItem[];
  ariaLabel?: string;
  mb?: string | number | Record<string, string | number>;
}

const TAB_TRIGGER_PROPS = {
  gap: { base: 0, md: 2 },
  borderRadius: { base: 0, md: 'xl' },
  px: { base: 3.5, md: 5 },
  py: { base: 3, md: 1 },
  flexShrink: 0,
  whiteSpace: 'nowrap',
  position: 'relative',
  color: 'var(--chakra-colors-fg\\.muted)',
  fontWeight: { base: '500', md: '600' },
  touchAction: 'manipulation',
  scrollMarginTop: {
    base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top) + 8px)`,
    md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top) + 8px)`,
  },
  _selected: {
    bg: { base: 'transparent', md: 'green.100' },
    color: 'brand.500',
    fontWeight: '600',
    shadow: { base: 'none', md: 'sm' },
    borderBottomWidth: { base: '4px', md: 0 },
    borderBottomColor: { base: 'brand.500', md: 'transparent' },
  },
  _hover: { color: 'brand.500' },
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'brand.500',
    outlineOffset: '-2px',
  },
} as const;

export function DetailSubMenu({
  items,
  ariaLabel,
  mb = 0,
}: DetailSubMenuProps) {
  const tabsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabsList = tabsListRef.current;
    if (!tabsList) return;

    const scrollActiveTabIntoView = (behavior: ScrollBehavior) => {
      tabsList
        .querySelector<HTMLElement>('[data-state="active"]')
        ?.scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' });
    };

    scrollActiveTabIntoView('auto');

    let animationFrameId: number | null = null;
    const observer = new MutationObserver(() => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      animationFrameId = requestAnimationFrame(() => {
        scrollActiveTabIntoView(prefersReducedMotion ? 'auto' : 'smooth');
        animationFrameId = null;
      });
    });
    observer.observe(tabsList, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state'],
    });

    return () => {
      observer.disconnect();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <Box
      position="sticky"
      top={{
        base: `calc(${TOP_BAR_HEIGHT_MOBILE}px + env(safe-area-inset-top))`,
        md: `calc(${TOP_BAR_HEIGHT_DESKTOP}px + env(safe-area-inset-top))`,
      }}
      zIndex="10"
      w="full"
      mb={mb}
    >
      <Tabs.List
        ref={tabsListRef}
        bg="white"
        _dark={{ bg: 'gray.900', borderColor: 'gray.800' }}
        shadow={{
          base: '0 2px 8px rgba(15, 23, 42, 0.08)',
          md: 'sm',
        }}
        borderRadius={{ base: 0, md: '2xl' }}
        borderBottomWidth={{ base: '1px', md: '1px' }}
        p={{ base: 0, md: 0.5 }}
        gap={1}
        borderWidth="1px"
        borderColor="gray.100"
        overflowX="auto"
        scrollbarWidth="none"
        css={{ '&::-webkit-scrollbar': { display: 'none' } }}
        display="flex"
        flexWrap="nowrap"
        aria-label={ariaLabel}
      >
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Tabs.Trigger key={item.id} value={item.id} {...TAB_TRIGGER_PROPS}>
              {Icon ? (
                <Box
                  as={Icon}
                  boxSize={4}
                  display={{ base: 'none', md: 'block' }}
                  aria-hidden="true"
                />
              ) : null}
              <Text fontSize="sm">{item.label}</Text>
              {item.badge !== undefined ? (
                <Badge
                  colorPalette="blue"
                  size="xs"
                  ml={1}
                  variant="solid"
                  borderRadius="full"
                >
                  {item.badge}
                </Badge>
              ) : null}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        w="28px"
        borderRadius="0 2xl 2xl 0"
        bgGradient="to-l"
        gradientFrom="white"
        gradientTo="transparent"
        _dark={{ gradientFrom: 'gray.900' }}
        pointerEvents="none"
        display={{ base: 'block', md: 'none' }}
      />
    </Box>
  );
}
