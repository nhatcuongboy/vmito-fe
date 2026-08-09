export * from './images';
export * from './routes';
export * from './feature-flags';

export const TOP_BAR_HEIGHT_MOBILE = 50;
export const TOP_BAR_HEIGHT_DESKTOP = 56;
export const TOP_BAR_HEIGHT = TOP_BAR_HEIGHT_DESKTOP;

export const BOTTOM_TAB_HEIGHT = 64;

export const CONTAINER_PX = '24px';
export const CONTENT_PT_OFFSET = '16px';
export const DETAIL_PAGE_MAX_W = '1095px';

export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

export const MAIN_PAGE_PATHS = [
  '/',
  '/my-clubs',
  '/newsfeed',
  '/venues',
  '/clubs',
  '/classes',
  '/tournaments',
] as const;

// Time range definitions
export const TIME_RANGES = [
  { key: 'morning', start: 5, end: 12 },
  { key: 'afternoon', start: 12, end: 18 },
  { key: 'evening', start: 18, end: 22 },
  { key: 'night', start: 22, end: 5 },
] as const;

// Max distance into the future a session (kèo) can be cloned to.
export const CLONE_SESSION_MAX_MONTHS_AHEAD = 3;
