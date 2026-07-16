export const CLUB_DETAIL_TABS = [
  'about',
  'members',
  'schedule',
  'announcements',
  'photos',
] as const;

export type TClubDetailTab = (typeof CLUB_DETAIL_TABS)[number];

export const DEFAULT_CLUB_TAB: TClubDetailTab = 'about';

export const isClubDetailTab = (
  value: string | null
): value is TClubDetailTab =>
  !!value && (CLUB_DETAIL_TABS as readonly string[]).includes(value);
