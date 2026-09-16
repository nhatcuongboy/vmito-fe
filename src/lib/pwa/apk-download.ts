import {
  APP_INSTALL_CONFIG,
  type InstallTarget,
} from '@/constants/android-app';

/** Shared by the install popup and banner so both APK CTAs behave the same. */
export function triggerApkDownload(target: InstallTarget) {
  const link = document.createElement('a');
  link.href = target.url;
  link.setAttribute(
    'download',
    `vmito-v${APP_INSTALL_CONFIG.android.version || 'latest'}.apk`
  );
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
