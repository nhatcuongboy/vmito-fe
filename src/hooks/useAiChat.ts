'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Locale } from '@/i18n/locales';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UseAiChatOptions {
  pageContext?: string;
  language?: Locale;
  errorMessage?: string;
}

export function useAiChat({
  pageContext,
  language,
  errorMessage = 'Sorry, something went wrong. Please try again later.',
}: UseAiChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      // Placeholder for assistant response
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);

      abortControllerRef.current = new AbortController();

      try {
        // Get JWT token from auth store
        const token = useAuthStore.getState().accessToken;

        const allMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            messages: allMessages,
            pageContext,
            language,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to get AI response');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: accumulated } : msg
            )
          );
        }
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return;
        console.error('AI chat error:', err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: errorMessage,
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isStreaming, pageContext, language, errorMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
    stopStreaming,
  };
}
