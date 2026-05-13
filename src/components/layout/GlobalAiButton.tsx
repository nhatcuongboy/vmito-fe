'use client';

import AiAssistant from '@/components/session/AiAssistant';
import { useAiAssistantVisibility } from '@/hooks/useAiAssistantVisibility';

export default function GlobalAiButton() {
  const shouldShow = useAiAssistantVisibility();

  if (!shouldShow) return null;

  return <AiAssistant showTrigger={false} />;
}
