'use client';

import { Flex, Box, Text, Badge } from '@chakra-ui/react';
import { CONTAINER_PX } from '@/constants';

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
  top?: string | number | Record<string, string | number>;
  zIndex?: number;
  boxShadow?: string;
}

export function UnderlineTabs({
  items,
  activeId,
  onTabClick,
  px = CONTAINER_PX,
  isFixed = false,
  top,
  zIndex = 1099,
  boxShadow,
}: UnderlineTabsProps) {
  return (
    <Box
      w="100%"
      position={isFixed ? 'fixed' : 'relative'}
      top={isFixed ? top : undefined}
      left={isFixed ? 0 : undefined}
      right={isFixed ? 0 : undefined}
      zIndex={isFixed ? zIndex : undefined}
      overflowX="auto"
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
      <Flex gap={6} minW="max-content">
        {items.map((tab) => {
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
            >
              <Text>{tab.label}</Text>
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
      </Flex>
    </Box>
  );
}
