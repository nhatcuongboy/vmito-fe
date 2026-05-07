'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Text, Textarea, Portal } from '@chakra-ui/react';
import { Sparkles, X, Send, Trash2, Square } from 'lucide-react';
import { useAiChat } from '@/hooks/useAiChat';
import AiChatMessage from './AiChatMessage';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';

const SUGGESTED_QUESTIONS = [
  'Cách tạo một kèo mới?',
  'Làm sao mời bạn vào kèo?',
  'Cách thu phí từ người chơi?',
  'Làm sao tạo nhóm mới?',
  'Phân biệt Host và Player?',
];

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext?: string;
}

export default function AiAssistantPanel({
  isOpen,
  onClose,
  pageContext,
}: AiAssistantPanelProps) {
  const { messages, isStreaming, sendMessage, clearMessages, stopStreaming } =
    useAiChat({ pageContext });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { pendingMessage, clearPendingMessage } = useAiAssistantStore();

  // Auto-send pending message (e.g. from session AI analysis chip)
  useEffect(() => {
    if (isOpen && pendingMessage) {
      clearMessages();
      sendMessage(pendingMessage);
      clearPendingMessage();
    }
  }, [isOpen, pendingMessage, clearMessages, sendMessage, clearPendingMessage]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    sendMessage(q);
  };

  if (!isOpen) return null;

  // ─── Shared inner panel content ─────────────────────────────────────────
  const panelContent = (
    <Flex direction="column" h="100%" bg={{ base: 'white', _dark: 'gray.800' }}>
      {/* Header */}
      <Flex
        align="center"
        justify="space-between"
        px={4}
        pt={isMobile ? 5 : 3}
        pb={3}
        borderBottom="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
        bgGradient="to-r"
        gradientFrom="purple.600"
        gradientTo="purple.500"
        borderRadius={isMobile ? '16px 16px 0 0' : '0'}
        flexShrink={0}
      >
        <Flex align="center" gap={2.5}>
          <Flex
            w="32px"
            h="32px"
            borderRadius="full"
            bg="whiteAlpha.200"
            align="center"
            justify="center"
          >
            <Sparkles size={16} color="white" />
          </Flex>
          <Box>
            <Text
              fontWeight="bold"
              color="white"
              fontSize="sm"
              lineHeight="1.2"
            >
              AI Assistant
            </Text>
            <Flex align="center" gap={1}>
              <Box w="6px" h="6px" borderRadius="full" bg="green.300" />
              <Text fontSize="xs" color="whiteAlpha.800">
                Powered by Gemini
              </Text>
            </Flex>
          </Box>
        </Flex>

        <Flex gap={1}>
          {messages.length > 0 && (
            <Box
              as="button"
              onClick={clearMessages}
              p={1.5}
              borderRadius="md"
              color="whiteAlpha.800"
              _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
              transition="all 0.2s"
              title="Xóa lịch sử"
            >
              <Trash2 size={15} />
            </Box>
          )}
          <Box
            as="button"
            onClick={onClose}
            p={1.5}
            borderRadius="md"
            color="whiteAlpha.800"
            _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
            transition="all 0.2s"
            title="Đóng"
          >
            <X size={16} />
          </Box>
        </Flex>
      </Flex>

      {/* Messages area */}
      <Box
        flex={1}
        overflowY="auto"
        py={4}
        bg={{ base: 'gray.50', _dark: 'gray.900' }}
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--chakra-colors-gray-300)',
            borderRadius: '2px',
          },
        }}
      >
        {messages.length === 0 ? (
          // Welcome state
          <Box px={4}>
            <Flex direction="column" align="center" mb={6} mt={2}>
              <Box
                w="52px"
                h="52px"
                borderRadius="full"
                bgGradient="to-br"
                gradientFrom="purple.500"
                gradientTo="purple.700"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mb={3}
                boxShadow="0 4px 14px rgba(128,90,213,0.4)"
              >
                <Sparkles size={24} color="white" />
              </Box>
              <Text
                fontWeight="bold"
                fontSize="md"
                color={{ base: 'gray.800', _dark: 'gray.100' }}
                mb={1}
              >
                Xin chào! 👋
              </Text>
              <Text
                fontSize="sm"
                color="gray.500"
                textAlign="center"
                maxW="240px"
                lineHeight="1.5"
              >
                Tôi là AI Assistant của Vmito. Tôi có thể giúp bạn sử dụng app
                dễ dàng hơn!
              </Text>
            </Flex>

            {/* Suggested questions */}
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.400"
              mb={2}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Gợi ý câu hỏi
            </Text>
            <Flex direction="column" gap={2}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <Box
                  key={q}
                  as="button"
                  onClick={() => handleSuggestedQuestion(q)}
                  textAlign="left"
                  px={3}
                  py={2.5}
                  borderRadius="10px"
                  border="1px solid"
                  borderColor={{ base: 'gray.200', _dark: 'gray.600' }}
                  bg={{ base: 'white', _dark: 'gray.800' }}
                  color={{ base: 'gray.700', _dark: 'gray.200' }}
                  fontSize="sm"
                  _hover={{
                    borderColor: 'purple.300',
                    bg: { base: 'purple.50', _dark: 'purple.900' },
                    color: 'purple.700',
                    transform: 'translateX(2px)',
                  }}
                  transition="all 0.15s"
                  cursor="pointer"
                >
                  {q}
                </Box>
              ))}
            </Flex>
          </Box>
        ) : (
          <Box px={2}>
            {messages.map((msg) => (
              <AiChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Input area */}
      <Box
        px={3}
        py={3}
        borderTop="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'gray.700' }}
        bg={{ base: 'white', _dark: 'gray.800' }}
        flexShrink={0}
      >
        <Flex
          align="center"
          gap={2}
          border="1.5px solid"
          borderColor={{
            base: isStreaming ? 'purple.300' : 'gray.200',
            _dark: isStreaming ? 'purple.500' : 'gray.600',
          }}
          borderRadius="14px"
          px={3}
          py={2}
          bg={{ base: 'gray.50', _dark: 'gray.900' }}
          transition="border-color 0.2s"
          _focusWithin={{
            borderColor: 'purple.400',
            boxShadow: '0 0 0 3px var(--chakra-colors-purple-100)',
          }}
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi gì đó về Vmito..."
            resize="none"
            border="none"
            outline="none"
            bg="transparent"
            fontSize="sm"
            lineHeight="1.5"
            minH="20px"
            maxH="120px"
            rows={1}
            p={0}
            _placeholder={{ color: 'gray.400' }}
            _focus={{ boxShadow: 'none', border: 'none' }}
            disabled={isStreaming}
            color={{ base: 'gray.800', _dark: 'gray.100' }}
            css={{
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              // Auto-resize
              overflow: 'hidden',
              resize: 'none',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />

          <Box
            as="button"
            onClick={isStreaming ? stopStreaming : handleSend}
            aria-disabled={!input.trim() && !isStreaming}
            style={{
              pointerEvents: !input.trim() && !isStreaming ? 'none' : undefined,
            }}
            w="32px"
            h="32px"
            borderRadius="10px"
            bg={
              isStreaming
                ? 'red.500'
                : input.trim()
                  ? 'purple.500'
                  : { base: 'gray.200', _dark: 'gray.600' }
            }
            color={
              input.trim() || isStreaming
                ? 'white'
                : { base: 'gray.400', _dark: 'gray.400' }
            }
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            cursor={!input.trim() && !isStreaming ? 'not-allowed' : 'pointer'}
            _hover={{
              transform: input.trim() || isStreaming ? 'scale(1.05)' : 'none',
              bg: isStreaming
                ? 'red.600'
                : input.trim()
                  ? 'purple.600'
                  : undefined,
            }}
            transition="all 0.15s"
            title={isStreaming ? 'Dừng' : 'Gửi (Enter)'}
          >
            {isStreaming ? <Square size={13} /> : <Send size={13} />}
          </Box>
        </Flex>

        <Text fontSize="xs" color="gray.400" textAlign="center" mt={2}>
          Enter để gửi · Shift+Enter xuống dòng
        </Text>
      </Box>
    </Flex>
  );

  // ─── Desktop: Side panel sliding from right ────────────────────────────
  if (!isMobile) {
    return (
      <Portal>
        {/* Subtle overlay */}
        <Box
          position="fixed"
          inset={0}
          zIndex={1199}
          onClick={onClose}
          cursor="default"
        />

        <Box
          position="fixed"
          top={0}
          right={0}
          bottom={0}
          w="380px"
          zIndex={1200}
          boxShadow="-4px 0 24px rgba(0,0,0,0.12)"
          animation="slideInRight 0.25s ease-out"
          css={{
            '@keyframes slideInRight': {
              from: { transform: 'translateX(100%)', opacity: 0 },
              to: { transform: 'translateX(0)', opacity: 1 },
            },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {panelContent}
        </Box>
      </Portal>
    );
  }

  // ─── Mobile: Bottom sheet ─────────────────────────────────────────────
  return (
    <Portal>
      {/* Dark overlay */}
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.500"
        zIndex={1199}
        onClick={onClose}
        animation="fadeIn 0.2s ease-out"
        css={{
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      />

      <Box
        position="fixed"
        left={0}
        right={0}
        bottom={0}
        h="85dvh"
        zIndex={1200}
        borderRadius="16px 16px 0 0"
        overflow="hidden"
        boxShadow="0 -8px 40px rgba(0,0,0,0.18)"
        animation="slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
        css={{
          '@keyframes slideUp': {
            from: { transform: 'translateY(100%)' },
            to: { transform: 'translateY(0)' },
          },
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <Flex
          justify="center"
          pt={2}
          pb={1}
          position="absolute"
          top={0}
          left={0}
          right={0}
          zIndex={10}
        >
          <Box w="36px" h="4px" borderRadius="full" bg="whiteAlpha.500" />
        </Flex>
        <Box h="100%">{panelContent}</Box>
      </Box>
    </Portal>
  );
}
