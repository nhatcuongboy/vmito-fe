'use client';

import { Box, Card, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/config';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sublabel?: string;
  colorPalette?: string;
  isLoading?: boolean;
  href?: string;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  colorPalette = 'green',
  isLoading,
  href,
}: StatCardProps) {
  const content = (
    <Card.Root
      _hover={href ? { borderColor: `${colorPalette}.400` } : undefined}
      transition="border-color 0.15s"
    >
      <Card.Body>
        <HStack gap={3} align="start">
          <Box
            p={2}
            borderRadius="md"
            bg={`${colorPalette}.100`}
            _dark={{ bg: `${colorPalette}.900/30` }}
            color={`${colorPalette}.600`}
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
              <Text fontSize="2xl" fontWeight="bold">
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
        </HStack>
      </Card.Body>
    </Card.Root>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: 'block' }}>
        {content}
      </Link>
    );
  }

  return content;
}
