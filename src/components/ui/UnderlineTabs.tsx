'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import {
  Flex,
  Box,
  Text,
  Badge,
  Icon,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
} from '@chakra-ui/react';
import { CONTAINER_PX } from '@/constants';
import { MoreHorizontal } from 'lucide-react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  badge?: number | string;
}

interface UnderlineTabsProps {
  items: TabItem[];
  activeId: string;
  onTabClick: (id: string) => void;
  px?: string | number | Record<string, string | number>;
  isFixed?: boolean;
  /** Sticks within the normal flow (needs `top`), unlike isFixed which overlays. */
  isSticky?: boolean;
  top?: string | number | Record<string, string | number>;
  zIndex?: number;
  boxShadow?: string;
  rightContent?: React.ReactNode;
  /** Limits inline tabs and moves remaining tabs into a more menu. */
  maxVisibleItems?: number;
  moreLabel?: string;
}

export function UnderlineTabs({
  items,
  activeId,
  onTabClick,
  px = CONTAINER_PX,
  isFixed = false,
  isSticky = false,
  top,
  zIndex = 1099,
  boxShadow,
  rightContent,
  maxVisibleItems,
  moreLabel = 'More navigation',
}: UnderlineTabsProps) {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const measurementContainerRef = useRef<HTMLDivElement>(null);
  const tabMeasurementRefs = useRef<Array<HTMLDivElement | null>>([]);
  const moreMeasurementRef = useRef<HTMLDivElement>(null);
  const maximumVisibleItems = maxVisibleItems
    ? Math.min(maxVisibleItems, items.length)
    : items.length;
  const [visibleItemCount, setVisibleItemCount] = useState(maximumVisibleItems);

  useLayoutEffect(() => {
    if (!maxVisibleItems) return;

    const updateVisibleItemCount = () => {
      const availableWidth = tabsContainerRef.current?.clientWidth;
      const measurementContainer = measurementContainerRef.current;
      const moreWidth = moreMeasurementRef.current?.offsetWidth;

      if (!availableWidth || !measurementContainer || !moreWidth) return;

      const gap = Number.parseFloat(
        window.getComputedStyle(measurementContainer).gap
      );
      const itemWidths = items
        .slice(0, maximumVisibleItems)
        .map((_, index) => tabMeasurementRefs.current[index]?.offsetWidth ?? 0);

      let usedWidth = 0;
      let nextVisibleItemCount = 0;

      for (const width of itemWidths) {
        const gapBeforeItem = nextVisibleItemCount > 0 ? gap : 0;
        const hasOverflowAfterItem = nextVisibleItemCount + 1 < items.length;
        const moreMenuWidth = hasOverflowAfterItem ? gap + moreWidth : 0;

        if (
          usedWidth + gapBeforeItem + width + moreMenuWidth >
          availableWidth
        ) {
          break;
        }

        usedWidth += gapBeforeItem + width;
        nextVisibleItemCount += 1;
      }

      setVisibleItemCount((currentCount) =>
        currentCount === nextVisibleItemCount
          ? currentCount
          : Math.max(1, nextVisibleItemCount)
      );
    };

    updateVisibleItemCount();

    if (typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(updateVisibleItemCount);
    if (tabsContainerRef.current)
      resizeObserver.observe(tabsContainerRef.current);
    if (measurementContainerRef.current) {
      resizeObserver.observe(measurementContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [items, maxVisibleItems, maximumVisibleItems]);

  const visibleItems = maxVisibleItems
    ? items.slice(0, visibleItemCount)
    : items;
  const overflowItems = maxVisibleItems ? items.slice(visibleItemCount) : [];
  const hasActiveOverflowItem = overflowItems.some(
    (tab) => tab.id === activeId
  );

  return (
    <Box
      w="100%"
      position={isFixed ? 'fixed' : isSticky ? 'sticky' : 'relative'}
      top={isFixed || isSticky ? top : undefined}
      left={isFixed ? 0 : undefined}
      right={isFixed ? 0 : undefined}
      zIndex={isFixed || isSticky ? zIndex : undefined}
      overflowX={maxVisibleItems ? 'hidden' : 'auto'}
      overflowY="hidden"
      css={{
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
      px={px}
      bg="bg"
      borderBottomWidth="1px"
      borderColor="border.subtle"
      boxShadow={boxShadow}
    >
      <Flex
        gap={rightContent ? 2 : 0}
        minW={maxVisibleItems ? 0 : 'max-content'}
        w={maxVisibleItems ? '100%' : undefined}
        align="center"
      >
        <Flex
          ref={tabsContainerRef}
          gap={maxVisibleItems ? 4 : 6}
          minW={maxVisibleItems ? 0 : 'max-content'}
          flex={maxVisibleItems ? '1 1 0' : undefined}
          overflow="hidden"
        >
          {visibleItems.map((tab) => {
            const active = activeId === tab.id;
            return (
              <Flex
                key={tab.id}
                as="button"
                onClick={() => onTabClick(tab.id)}
                pt={2.5}
                pb={2.5}
                borderBottomWidth="2px"
                borderColor={active ? 'brand.500' : 'transparent'}
                color={active ? 'brand.600' : 'fg.muted'}
                transition="color 0.2s, border-color 0.2s"
                _hover={{ color: active ? 'brand.700' : 'fg' }}
                whiteSpace="nowrap"
                fontWeight={active ? '600' : '500'}
                fontSize="sm"
                mb="-1px"
                cursor="pointer"
              >
                <Text as="span">{tab.label}</Text>
                {tab.badge !== undefined && tab.badge !== null && (
                  <Badge
                    ml={1.5}
                    borderRadius="full"
                    bg="red.500"
                    color="white"
                    fontSize="xs"
                    px={1.5}
                    minW="18px"
                    textAlign="center"
                    _dark={{
                      bg: 'red.600',
                      color: 'white',
                    }}
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Flex>
            );
          })}
          {overflowItems.length > 0 && (
            <MenuRoot positioning={{ placement: 'bottom-end' }}>
              <MenuTrigger asChild>
                <Box
                  as="button"
                  aria-label={moreLabel}
                  aria-haspopup="menu"
                  pt={2.5}
                  pb={2.5}
                  borderBottomWidth="2px"
                  borderColor={
                    hasActiveOverflowItem ? 'brand.500' : 'transparent'
                  }
                  color={hasActiveOverflowItem ? 'brand.600' : 'fg.muted'}
                  transition="color 0.2s, border-color 0.2s"
                  _hover={{ color: hasActiveOverflowItem ? 'brand.700' : 'fg' }}
                  mb="-1px"
                  cursor="pointer"
                >
                  <Icon as={MoreHorizontal} boxSize={5} />
                </Box>
              </MenuTrigger>
              <Portal>
                <MenuPositioner zIndex={zIndex + 1}>
                  <MenuContent minW="160px">
                    {overflowItems.map((tab) => (
                      <MenuItem
                        key={tab.id}
                        value={tab.id}
                        onClick={() => onTabClick(tab.id)}
                        color={activeId === tab.id ? 'brand.600' : undefined}
                        fontWeight={activeId === tab.id ? '600' : '400'}
                      >
                        {tab.label}
                        {tab.badge !== undefined && tab.badge !== null && (
                          <Badge
                            ml="auto"
                            borderRadius="full"
                            colorPalette="red"
                          >
                            {tab.badge}
                          </Badge>
                        )}
                      </MenuItem>
                    ))}
                  </MenuContent>
                </MenuPositioner>
              </Portal>
            </MenuRoot>
          )}
        </Flex>
        {rightContent && (
          <Box flexShrink={0} ml={2}>
            {rightContent}
          </Box>
        )}
      </Flex>
      {maxVisibleItems && (
        <Flex
          ref={measurementContainerRef}
          position="absolute"
          visibility="hidden"
          pointerEvents="none"
          gap={4}
          whiteSpace="nowrap"
        >
          {items.slice(0, maximumVisibleItems).map((tab, index) => (
            <Flex
              key={tab.id}
              ref={(element) => {
                tabMeasurementRefs.current[index] = element;
              }}
              pt={2.5}
              pb={2.5}
              fontWeight={activeId === tab.id ? '600' : '500'}
              fontSize="sm"
            >
              <Text as="span">{tab.label}</Text>
              {tab.badge !== undefined && tab.badge !== null && (
                <Badge
                  ml={1.5}
                  borderRadius="full"
                  bg="red.500"
                  color="white"
                  fontSize="xs"
                  px={1.5}
                  minW="18px"
                >
                  {tab.badge}
                </Badge>
              )}
            </Flex>
          ))}
          <Box ref={moreMeasurementRef} pt={2.5} pb={2.5}>
            <Icon as={MoreHorizontal} boxSize={5} />
          </Box>
        </Flex>
      )}
    </Box>
  );
}
