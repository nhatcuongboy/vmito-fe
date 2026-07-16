import {
  SessionShareTemplateId,
  SessionShareTemplateMeta,
  SessionShareThemeId,
  SessionShareThemeMeta,
} from './types';

export type TLegacySessionShareMode = 'portrait' | 'landscape' | 'social';

export const SESSION_SHARE_THEMES: SessionShareThemeMeta[] = [
  {
    id: 'default',
    name: 'Mặc định',
    primary: '#179a3b',
    primaryDark: '#0d7f31',
    accent: '#ffd84d',
    background: '#f7faf5',
    surface: '#ffffff',
    surfaceAlt: '#e7f8ec',
    text: '#222631',
    textOnPrimary: '#ffffff',
    mutedText: '#66706a',
    border: '#dfe8dd',
    price: '#e9292f',
    qr: '#179a3b',
  },
  {
    id: 'dark',
    name: 'Tối',
    primary: '#22c55e',
    primaryDark: '#0f3f25',
    accent: '#38bdf8',
    background: '#08111f',
    surface: '#111827',
    surfaceAlt: '#1f2937',
    text: '#f8fafc',
    textOnPrimary: '#ffffff',
    mutedText: '#cbd5e1',
    border: '#334155',
    price: '#fb7185',
    qr: '#22c55e',
  },
  {
    id: 'premium',
    name: 'Premium',
    primary: '#d4af37',
    primaryDark: '#172033',
    accent: '#f6d36b',
    background: '#0f172a',
    surface: '#172033',
    surfaceAlt: '#243047',
    text: '#f8fafc',
    textOnPrimary: '#ffffff',
    mutedText: '#d6deec',
    border: '#3a465d',
    price: '#d4af37',
    qr: '#d4af37',
  },
  {
    id: 'sport-yellow',
    name: 'Vàng thể thao',
    primary: '#facc15',
    primaryDark: '#111111',
    accent: '#f97316',
    background: '#111111',
    surface: '#1f1f1f',
    surfaceAlt: '#2b250d',
    text: '#fff7d6',
    textOnPrimary: '#ffffff',
    mutedText: '#f8e8a0',
    border: '#5f4a08',
    price: '#ef4444',
    qr: '#facc15',
  },
  {
    id: 'club-green',
    name: 'Xanh CLB',
    primary: '#16a34a',
    primaryDark: '#064e3b',
    accent: '#86efac',
    background: '#ecfdf5',
    surface: '#ffffff',
    surfaceAlt: '#dcfce7',
    text: '#173524',
    textOnPrimary: '#ffffff',
    mutedText: '#486557',
    border: '#bbf7d0',
    price: '#dc2626',
    qr: '#16a34a',
  },
];

export const SESSION_SHARE_TEMPLATES: SessionShareTemplateMeta[] = [
  {
    id: 'legacy-portrait',
    name: 'Mẫu chuẩn 2:3',
    ratioLabel: '2:3',
    width: 800,
    height: 1200,
    description: 'Thiết kế ban đầu dạng dọc, quen thuộc với host.',
  },
  {
    id: 'legacy-social',
    name: 'Mẫu chuẩn 4:5',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Thiết kế ban đầu dạng social poster.',
  },
  {
    id: 'event-pass',
    name: 'Vé tham gia',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Premium, giống vé mời tham gia kèo.',
  },
  {
    id: 'ai-neon-stadium',
    name: 'Sân neon',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Nền sân đêm, đèn neon xanh vàng, năng lượng cao.',
  },
  {
    id: 'ai-yellow-smash',
    name: 'Vàng đen năng động',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Nền thể thao vàng đen, nổi bật như poster tuyển người.',
  },
  {
    id: 'classic-clean',
    name: 'Gọn gàng',
    ratioLabel: '2:3',
    width: 800,
    height: 1200,
    description: 'Dễ đọc, đủ thông tin, hợp đăng nhóm.',
  },
  {
    id: 'social-poster',
    name: 'Poster nổi bật',
    ratioLabel: '4:5',
    width: 1080,
    height: 1350,
    description: 'Nổi bật tên kèo, giờ chơi và chi phí.',
  },
  {
    id: 'story-vertical',
    name: 'Story',
    ratioLabel: '9:16',
    width: 1080,
    height: 1920,
    description: 'Tối ưu story Facebook, Instagram, Zalo.',
  },
  {
    id: 'square-feed',
    name: 'Feed vuông',
    ratioLabel: '1:1',
    width: 1080,
    height: 1080,
    description: 'Gọn đẹp cho feed và thumbnail.',
  },
];

export const AI_BACKGROUND_URLS: Record<
  Extract<SessionShareTemplateId, 'ai-neon-stadium' | 'ai-yellow-smash'>,
  string
> = {
  'ai-neon-stadium':
    'https://res.cloudinary.com/dzehhkd9m/image/upload/v1783597597/badminton/session-ai-backgrounds/q9ycfvsbpasnzvmizp4v.png',
  'ai-yellow-smash':
    'https://res.cloudinary.com/dzehhkd9m/image/upload/v1783597467/badminton/session-ai-backgrounds/aqytyzubk5fbrw5f37ln.png',
};

export const getSessionShareTheme = (themeId?: SessionShareThemeId) =>
  SESSION_SHARE_THEMES.find((theme) => theme.id === themeId) ||
  SESSION_SHARE_THEMES[0];

export const getSessionShareTemplate = (templateId?: SessionShareTemplateId) =>
  SESSION_SHARE_TEMPLATES.find((template) => template.id === templateId) ||
  SESSION_SHARE_TEMPLATES[0];

export const legacyModeToTemplate = (
  mode?: TLegacySessionShareMode
): SessionShareTemplateId => {
  if (mode === 'social') return 'legacy-social';
  if (mode === 'landscape') return 'square-feed';
  return 'legacy-portrait';
};

export const getSessionShareCardElementId = (
  sessionId: string,
  templateId: SessionShareTemplateId
) => `session-share-card-${templateId}-${sessionId}`;
