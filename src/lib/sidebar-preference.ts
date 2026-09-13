export const SIDEBAR_COOKIE = 'sidebar-collapsed';

export function parseSidebarPreference(value?: string): boolean | undefined {
  return value === 'true' ? true : value === 'false' ? false : undefined;
}

export function writeSidebarPreference(collapsed: boolean): void {
  document.cookie = `${SIDEBAR_COOKIE}=${collapsed}; path=/; max-age=31536000; SameSite=Lax`;
}
