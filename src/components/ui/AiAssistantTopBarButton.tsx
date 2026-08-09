'use client';

import { getAiAssistantPageContextKey } from '@/components/ai/aiAssistantSuggestions';
import { usePathname } from '@/i18n/config';
import { useAiAssistantStore } from '@/stores/useAiAssistantStore';
import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function AiAssistantTopBarButton() {
  const common = useTranslations('common');
  const t = useTranslations('aiAssistant');
  const pathname = usePathname();
  const open = useAiAssistantStore((state) => state.open);
  const isOpen = useAiAssistantStore((state) => state.isOpen);

  return (
    <button
      type="button"
      className="ai-topbar-button"
      data-open={isOpen ? 'true' : undefined}
      aria-label={common('aiAssistant')}
      title={common('aiAssistant')}
      onClick={() =>
        open(t(`pageContexts.${getAiAssistantPageContextKey(pathname)}`))
      }
    >
      <span className="ai-topbar-sparkle">
        <Sparkles size={18} />
      </span>
    </button>
  );
}
