'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import { ChevronRight, LucideIcon } from 'lucide-react';

export interface ManageMenuItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  preview?: React.ReactNode;
  onClick?: () => void;
  badge?: string;
  variant?: 'default' | 'highlight' | 'danger';
  isActive?: boolean;
}

export default function ManageMenuItem({
  icon: Icon,
  title,
  description,
  preview,
  onClick,
  badge,
  variant = 'default',
  isActive = false,
}: ManageMenuItemProps) {
  if (variant === 'highlight') {
    return (
      <Flex
        borderRadius="xl"
        bg="yellow.400"
        px={4}
        py={4}
        align="center"
        gap={3}
        cursor="pointer"
        onClick={onClick}
        _hover={{ bg: 'yellow.500' }}
        _dark={{
          bg: 'yellow.900',
          borderColor: 'yellow.700',
          _hover: { bg: 'yellow.800' },
        }}
        transition="all 0.15s"
      >
        <Box
          w="10px"
          h="10px"
          borderRadius="full"
          bg="yellow.600"
          flexShrink={0}
        />
        <Box flex="1">
          <Text
            fontWeight="bold"
            fontSize="sm"
            color="gray.900"
            _dark={{ color: 'yellow.50' }}
          >
            {title}
          </Text>
          {description && (
            <Text
              fontSize="xs"
              color="gray.700"
              mt={0.5}
              _dark={{ color: 'yellow.100' }}
            >
              {description}
            </Text>
          )}
        </Box>
        <ChevronRight size={18} color="#744210" />
      </Flex>
    );
  }

  return (
    <Flex
      borderWidth="1px"
      borderColor={isActive ? 'gray.400' : 'gray.200'}
      borderRadius="xl"
      bg={isActive ? 'gray.50' : 'white'}
      px={4}
      py={3}
      align="center"
      gap={3}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={onClick ? { bg: 'gray.50', borderColor: 'gray.300' } : {}}
      _dark={{
        bg: isActive ? 'gray.700' : 'gray.800',
        borderColor: isActive ? 'gray.500' : 'gray.700',
        _hover: onClick ? { bg: 'gray.700', borderColor: 'gray.600' } : {},
      }}
      transition="all 0.15s"
    >
      <Flex
        w="32px"
        h="32px"
        align="center"
        justify="center"
        flexShrink={0}
        color={variant === 'danger' ? 'red.500' : 'gray.500'}
        _dark={{ color: variant === 'danger' ? 'red.300' : 'gray.300' }}
      >
        <Icon size={20} />
      </Flex>
      <Box flex="1" minW={0}>
        <Flex align="center" gap={2}>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            color={variant === 'danger' ? 'red.600' : 'fg'}
          >
            {title}
          </Text>
          {badge && (
            <Box
              bg="gray.100"
              px={2}
              py={0.5}
              borderRadius="md"
              fontSize="2xs"
              fontWeight="bold"
              color="gray.600"
              _dark={{ bg: 'gray.700', color: 'gray.300' }}
            >
              {badge}
            </Box>
          )}
        </Flex>
        {description && (
          <Text
            fontSize="xs"
            color={variant === 'danger' ? 'red.400' : 'gray.500'}
            _dark={{ color: variant === 'danger' ? 'red.300' : 'gray.400' }}
            mt={0.5}
            lineClamp={2}
          >
            {description}
          </Text>
        )}
        {preview && <Box mt={2}>{preview}</Box>}
      </Box>
      {onClick && (
        <Box flexShrink={0} color="gray.400" _dark={{ color: 'gray.500' }}>
          <ChevronRight size={18} />
        </Box>
      )}
    </Flex>
  );
}
