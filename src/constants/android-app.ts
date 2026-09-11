/**
 * Android APK installation configuration.
 * All values are controlled via environment variables so the download link,
 * version, and prompt status can be updated without code changes.
 */
export const ANDROID_APP_CONFIG = {
  downloadUrl:
    process.env.NEXT_PUBLIC_ANDROID_APK_URL ||
    'https://vmito.com/courts/app-release.apk',
  version: process.env.NEXT_PUBLIC_ANDROID_APP_VERSION || '1.0.0',
  fileSize: process.env.NEXT_PUBLIC_ANDROID_APK_SIZE || '32 MB',
  releaseNotes:
    process.env.NEXT_PUBLIC_ANDROID_RELEASE_NOTES ||
    'Cập nhật tính năng ghép kèo, thông báo thời gian thực và tối ưu hiệu năng.',
  isEnabled: process.env.NEXT_PUBLIC_ANDROID_INSTALL_PROMPT_ENABLED !== 'false',
} as const;

export type AndroidAppConfig = typeof ANDROID_APP_CONFIG;
