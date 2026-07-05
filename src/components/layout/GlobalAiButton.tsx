'use client';

import dynamic from 'next/dynamic';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';

// AI assistant panel + chat logic is interaction-only — load after hydration
const AiAssistant = dynamic(() => import('@/components/session/AiAssistant'), {
  ssr: false,
});

export default function GlobalAiButton() {
  const shouldShow = useAiAssistantVisibility();

  if (!shouldShow) return null;

  return <AiAssistant showTrigger={false} />;
}
