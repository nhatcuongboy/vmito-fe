// src/lib/dayjs.ts
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import { Locale } from '@/i18n/locales';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';

// Activate plugins
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// Set default locale to Vietnamese
dayjs.locale(Locale.VI);

// (Optional) Set default timezone, example: Asia/Ho_Chi_Minh
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

// Map an app locale to the matching dayjs locale id
export const getDayjsLocale = (locale: string): string => {
  switch (locale) {
    case Locale.VI:
      return 'vi';
    case Locale.CN:
      return 'zh-cn';
    default:
      return 'en';
  }
};

export default dayjs;
