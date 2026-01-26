export enum Locale {
  VI = 'vi',
  EN = 'en',
  CN = 'cn',
}

export const SUPPORTED_LOCALES = [Locale.VI, Locale.EN, Locale.CN] as const;

export type LocaleType = (typeof SUPPORTED_LOCALES)[number];
