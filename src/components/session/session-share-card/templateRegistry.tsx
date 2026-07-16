'use client';

import type React from 'react';
import { AiBackgroundCard } from './templates/AiShareTemplates';
import {
  LegacyPortraitCard,
  LegacySocialCard,
} from './templates/LegacyShareTemplates';
import {
  ClassicCleanCard,
  EventPassCard,
  SocialPosterCard,
  SquareFeedCard,
  StoryVerticalCard,
} from './templates/StandardShareTemplates';
import { ISessionShareTemplateProps, SessionShareTemplateId } from './types';

export const SESSION_SHARE_TEMPLATE_RENDERERS: Record<
  SessionShareTemplateId,
  React.ComponentType<ISessionShareTemplateProps>
> = {
  'legacy-portrait': LegacyPortraitCard,
  'legacy-social': LegacySocialCard,
  'classic-clean': ClassicCleanCard,
  'social-poster': SocialPosterCard,
  'story-vertical': StoryVerticalCard,
  'square-feed': SquareFeedCard,
  'event-pass': EventPassCard,
  'ai-neon-stadium': (props) => (
    <AiBackgroundCard {...props} variant="ai-neon-stadium" />
  ),
  'ai-yellow-smash': (props) => (
    <AiBackgroundCard {...props} variant="ai-yellow-smash" />
  ),
};
