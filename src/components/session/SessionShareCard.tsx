'use client';

import { ISession } from '@/lib/api/types';
import { useLocale } from 'next-intl';
import {
  getSessionShareCardElementId,
  getSessionShareTemplate,
  getSessionShareTheme,
  legacyModeToTemplate,
  SESSION_SHARE_TEMPLATES,
  SESSION_SHARE_THEMES,
} from './session-share-card/config';
import { SESSION_SHARE_TEMPLATE_RENDERERS } from './session-share-card/templateRegistry';
import {
  SessionShareTemplateId,
  SessionShareThemeId,
} from './session-share-card/types';
import { useSessionShareCardData } from './session-share-card/useSessionShareCardData';
import { useSessionShareQr } from './session-share-card/useSessionShareQr';

export {
  getSessionShareCardElementId,
  SESSION_SHARE_TEMPLATES,
  SESSION_SHARE_THEMES,
};
export type {
  SessionShareTemplateId,
  SessionShareTemplateMeta,
  SessionShareThemeId,
  SessionShareThemeMeta,
} from './session-share-card/types';

interface SessionShareCardProps {
  session: ISession;
  mode?: 'portrait' | 'landscape' | 'social';
  templateId?: SessionShareTemplateId;
  themeId?: SessionShareThemeId;
  captureId?: string | null;
}

const SessionShareCard = ({
  session,
  mode,
  templateId,
  themeId,
  captureId,
}: SessionShareCardProps) => {
  const locale = useLocale();
  const resolvedTemplateId = templateId || legacyModeToTemplate(mode);
  const meta = getSessionShareTemplate(resolvedTemplateId);
  const theme = getSessionShareTheme(themeId);
  const data = useSessionShareCardData(session);
  const qrDataUrl = useSessionShareQr({
    locale,
    sessionId: session.id,
    templateId: resolvedTemplateId,
    theme,
  });
  const elementId =
    captureId === null
      ? undefined
      : captureId ||
        getSessionShareCardElementId(session.id, resolvedTemplateId);
  const TemplateRenderer = SESSION_SHARE_TEMPLATE_RENDERERS[resolvedTemplateId];

  return (
    <TemplateRenderer
      id={elementId}
      session={session}
      data={data}
      qrDataUrl={qrDataUrl}
      meta={meta}
      theme={theme}
    />
  );
};

export default SessionShareCard;
