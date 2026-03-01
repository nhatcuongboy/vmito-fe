export * from './images';
export * from './routes';
export * from './feature-flags';

export const TOP_BAR_HEIGHT_MOBILE = 50;
export const TOP_BAR_HEIGHT_DESKTOP = 56;
export const TOP_BAR_HEIGHT = TOP_BAR_HEIGHT_DESKTOP;

export const CONTAINER_PX = '24px';
export const CONTENT_PT_OFFSET = '16px';

export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

// Time range definitions
export const TIME_RANGES = [
  { key: 'morning', start: 5, end: 12 },
  { key: 'afternoon', start: 12, end: 18 },
  { key: 'evening', start: 18, end: 22 },
  { key: 'night', start: 22, end: 5 },
] as const;
