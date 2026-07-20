'use client';

import type { ReactNode } from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

interface SectionCardProps {
  title: string;
  /** Optional helper line under the title. */
  description?: string;
  /** Rendered on the right of the header (badges, secondary actions). */
  headerRight?: ReactNode;
  /** Rendered in a bordered footer, typically the section's save button. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Card wrapper shared by the venue rental settings sections. Matches the
 * pricing feature's card shape (see PriceRuleList) so both admin venue pages
 * read as one system, and gives each section a real <h2> for the a11y tree.
 */
export default function SectionCard({
  title,
  description,
  headerRight,
  footer,
  children,
}: SectionCardProps) {
  const divider = { base: 'gray.200', _dark: 'gray.700' };

  return (
    <Box
      as="section"
      bg={{ base: 'white', _dark: 'gray.900' }}
      borderWidth="1px"
      borderColor={divider}
      borderRadius="xl"
      shadow="sm"
      overflow="hidden"
    >
      <Flex
        justify="space-between"
        align="center"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={4}
        borderBottomWidth="1px"
        borderColor={divider}
      >
        <Box minW={0}>
          <Heading as="h2" size="md" textWrap="balance">
            {title}
          </Heading>
          {description && (
            <Text fontSize="sm" color="gray.500" mt={1}>
              {description}
            </Text>
          )}
        </Box>
        {headerRight && <Box flexShrink={0}>{headerRight}</Box>}
      </Flex>

      <Box px={{ base: 4, md: 5 }} py={4}>
        {children}
      </Box>

      {footer && (
        <Flex
          px={{ base: 4, md: 5 }}
          py={3}
          borderTopWidth="1px"
          borderColor={divider}
          bg={{ base: 'gray.50', _dark: 'gray.800' }}
          align="center"
          gap={3}
        >
          {footer}
        </Flex>
      )}
    </Box>
  );
}
