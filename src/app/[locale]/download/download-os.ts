export const DOWNLOAD_OS_VALUES = ['ios', 'android'] as const;

export type DownloadOs = (typeof DOWNLOAD_OS_VALUES)[number];

export function isDownloadOs(value: string): value is DownloadOs {
  return (DOWNLOAD_OS_VALUES as readonly string[]).includes(value);
}

export const OTHER_DOWNLOAD_OS: Record<DownloadOs, DownloadOs> = {
  ios: 'android',
  android: 'ios',
};
