import { ISession } from '@/lib/api/types';

export type SessionShareTemplateId =
  | 'legacy-portrait'
  | 'legacy-social'
  | 'classic-clean'
  | 'social-poster'
  | 'story-vertical'
  | 'square-feed'
  | 'event-pass'
  | 'ai-neon-stadium'
  | 'ai-yellow-smash';

export type SessionShareThemeId =
  | 'default'
  | 'dark'
  | 'premium'
  | 'sport-yellow'
  | 'club-green';

export interface SessionShareTemplateMeta {
  id: SessionShareTemplateId;
  name: string;
  ratioLabel: string;
  width: number;
  height: number;
  description: string;
}

export interface SessionShareThemeMeta {
  id: SessionShareThemeId;
  name: string;
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textOnPrimary: string;
  mutedText: string;
  border: string;
  price: string;
  qr: string;
}

export interface IShareCardData {
  date: string;
  time: string;
  venue: string;
  address: string;
  host: string;
  courts: string;
  maxPlayers: string;
  phone?: string;
  shuttlecock?: string;
  fee?: string;
}

export interface ISessionShareTemplateProps {
  id?: string;
  session: ISession;
  data: IShareCardData;
  qrDataUrl: string;
  meta: SessionShareTemplateMeta;
  theme: SessionShareThemeMeta;
}
