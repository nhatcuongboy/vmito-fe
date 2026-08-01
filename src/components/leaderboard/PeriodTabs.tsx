'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

// motion(Box) resolves Chakra semantic tokens correctly; a raw CSS var()
// string (e.g. 'var(--chakra-colors-bg-panel)') does not match this
// project's generated variable names and silently renders no background.
const MotionBox = motion(Box);

export interface PeriodTabItem {
  id: string;
  label: string;
}

interface PeriodTabsProps {
  items: PeriodTabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function PeriodTabs({
  items,
  activeId,
  onChange,
}: PeriodTabsProps) {
  return (
    <Flex
      p={1}
      gap={1}
      bg="bg.muted"
      borderRadius="full"
      borderWidth="1px"
      borderColor="border.subtle"
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <Box
            key={item.id}
            as="button"
            onClick={() => onChange(item.id)}
            position="relative"
            flex="1 0 auto"
            px={{ base: 2, sm: 4 }}
            py={2}
            borderRadius="full"
            cursor="pointer"
            whiteSpace="nowrap"
          >
            {isActive && (
              <MotionBox
                layoutId="leaderboard-period-tab"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                position="absolute"
                inset={0}
                borderRadius="full"
                bg="bg.panel"
                boxShadow="0 1px 3px rgba(0,0,0,0.12)"
              />
            )}
            <Text
              position="relative"
              fontSize={{ base: 'xs', sm: 'sm' }}
              fontWeight={isActive ? '700' : '500'}
              color={isActive ? 'brand.600' : 'fg.muted'}
              transition="color 0.2s"
            >
              {item.label}
            </Text>
          </Box>
        );
      })}
    </Flex>
  );
}
