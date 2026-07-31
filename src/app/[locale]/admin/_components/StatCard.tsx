'use client';

import {
  Box,
  Card,
  HStack,
  Link as ChakraLink,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/config';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sublabel?: string;
  colorPalette?: string;
  isLoading?: boolean;
  href?: string;
  isHighlighted?: boolean;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  colorPalette = 'green',
  isLoading,
  href,
  isHighlighted = false,
}: StatCardProps) {
  const content = (
    <Card.Root
      height="100%"
      minH="116px"
      borderColor={isHighlighted ? `${colorPalette}.300` : 'border'}
      bg={isHighlighted ? `${colorPalette}.50` : 'bg.panel'}
      _dark={{
        bg: isHighlighted ? `${colorPalette}.950` : 'bg.panel',
        borderColor: isHighlighted ? `${colorPalette}.700` : 'border',
      }}
      _hover={
        href
          ? {
              borderColor: `${colorPalette}.400`,
              shadow: 'sm',
              transform: 'translateY(-1px)',
            }
          : undefined
      }
      transition="border-color 0.15s, box-shadow 0.15s, transform 0.15s"
    >
      <Card.Body>
        <HStack gap={3} align="start" height="100%">
          <Box
            p={2}
            borderRadius="md"
            bg={`${colorPalette}.100`}
            _dark={{ bg: `${colorPalette}.900/30` }}
            color={`${colorPalette}.600`}
            aria-hidden="true"
          >
            <Icon size={18} />
          </Box>
          <VStack gap={0} align="start" flex={1}>
            <Text fontSize="sm" color="gray.500" _dark={{ color: 'gray.400' }}>
              {label}
            </Text>
            {isLoading ? (
              <Skeleton height="28px" width="60px" mt={1} />
            ) : (
              <Text
                fontSize="2xl"
                fontWeight="bold"
                fontVariantNumeric="tabular-nums"
              >
                {value}
              </Text>
            )}
            {sublabel && (
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: 'gray.400' }}
              >
                {sublabel}
              </Text>
            )}
          </VStack>
          {href && (
            <Box color="gray.400" mt={1} aria-hidden="true">
              <ChevronRight size={18} />
            </Box>
          )}
        </HStack>
      </Card.Body>
    </Card.Root>
  );

  if (href) {
    return (
      <ChakraLink
        asChild
        display="block"
        height="100%"
        textDecoration="none"
        borderRadius="md"
        _focusVisible={{ outline: '2px solid', outlineColor: 'green.500' }}
      >
        <Link href={href}>{content}</Link>
      </ChakraLink>
    );
  }

  return content;
}
