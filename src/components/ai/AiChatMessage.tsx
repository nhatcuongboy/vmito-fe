'use client';

import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Sparkles, User } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useAiChat';

interface AiChatMessageProps {
  message: ChatMessage;
}

// Simple markdown-like renderer for bold, bullet lists
function renderContent(content: string) {
  if (!content) {
    return (
      <Flex align="center" gap={1}>
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="purple.400"
          animation="pulse 1s infinite"
          css={{
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.3 },
            },
          }}
        />
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="purple.400"
          animation="pulse 1s 0.2s infinite"
          css={{
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.3 },
            },
          }}
        />
        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg="purple.400"
          animation="pulse 1s 0.4s infinite"
          css={{
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.3 },
            },
          }}
        />
      </Flex>
    );
  }

  // Split by newlines and render line by line
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        // Bold: **text**
        const processedParts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text as="strong" key={j} fontWeight="semibold">
                {part.slice(2, -2)}
              </Text>
            );
          }
          return part;
        });

        // Bullet list
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <Flex key={i} align="flex-start" gap={1.5} mb={0.5}>
              <Box
                w="5px"
                h="5px"
                borderRadius="full"
                bg="currentColor"
                mt="7px"
                flexShrink={0}
                opacity={0.6}
              />
              <Text fontSize="sm" lineHeight="1.6">
                {processedParts}
              </Text>
            </Flex>
          );
        }

        // Heading: ## text
        if (line.startsWith('## ')) {
          return (
            <Text
              key={i}
              fontSize="sm"
              fontWeight="bold"
              mt={i > 0 ? 2 : 0}
              mb={0.5}
            >
              {line.slice(3)}
            </Text>
          );
        }

        // Empty line = spacing
        if (!line.trim()) {
          return <Box key={i} h={1} />;
        }

        return (
          <Text key={i} fontSize="sm" lineHeight="1.6">
            {processedParts}
          </Text>
        );
      })}
    </>
  );
}

export default function AiChatMessage({ message }: AiChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <Flex justify="flex-end" mb={3} px={1}>
        <Box
          maxW="80%"
          bg="purple.500"
          color="white"
          px={3}
          py={2}
          borderRadius="18px 18px 4px 18px"
          boxShadow="0 1px 2px rgba(0,0,0,0.1)"
        >
          <Text fontSize="sm" lineHeight="1.5">
            {message.content}
          </Text>
        </Box>
        <Flex
          w="28px"
          h="28px"
          borderRadius="full"
          bg="purple.100"
          color="purple.600"
          align="center"
          justify="center"
          ml={2}
          flexShrink={0}
          mt="auto"
        >
          <User size={14} />
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex align="flex-start" mb={3} px={1}>
      <Flex
        w="28px"
        h="28px"
        borderRadius="full"
        bgGradient="to-br"
        gradientFrom="purple.500"
        gradientTo="purple.700"
        color="white"
        align="center"
        justify="center"
        mr={2}
        flexShrink={0}
        boxShadow="0 2px 6px rgba(128,90,213,0.4)"
      >
        <Sparkles size={13} />
      </Flex>
      <Box
        maxW="85%"
        bg={{ base: 'white', _dark: 'gray.700' }}
        color={{ base: 'gray.800', _dark: 'gray.100' }}
        px={3}
        py={2.5}
        borderRadius="4px 18px 18px 18px"
        boxShadow="0 1px 3px rgba(0,0,0,0.08)"
        border="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'gray.600' }}
        minW="60px"
      >
        {renderContent(message.content)}
      </Box>
    </Flex>
  );
}
