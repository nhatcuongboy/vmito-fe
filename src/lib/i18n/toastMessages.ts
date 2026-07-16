import { Locale, SUPPORTED_LOCALES } from '@/i18n/locales';

type ToastMessageKey =
  | 'tournamentCreatedSuccessfully'
  | 'pairUpdatedSuccessfully'
  | 'categoryUpdatedSuccessfully'
  | 'matchEndedSuccessfully'
  | 'tournamentPublishedSuccessfully';

const TOAST_MESSAGES: Record<Locale, Record<ToastMessageKey, string>> = {
  [Locale.VI]: {
    tournamentCreatedSuccessfully: 'Giải đấu đã được tạo thành công',
    pairUpdatedSuccessfully: 'Cặp đấu đã được cập nhật thành công',
    categoryUpdatedSuccessfully: 'Hạng mục đã được cập nhật thành công',
    matchEndedSuccessfully: 'Trận đấu đã kết thúc thành công',
    tournamentPublishedSuccessfully: 'Giải đấu đã được công khai thành công',
  },
  [Locale.EN]: {
    tournamentCreatedSuccessfully: 'Tournament created successfully',
    pairUpdatedSuccessfully: 'Pair updated successfully',
    categoryUpdatedSuccessfully: 'Category updated successfully',
    matchEndedSuccessfully: 'Match ended successfully',
    tournamentPublishedSuccessfully: 'Tournament published successfully',
  },
  [Locale.CN]: {
    tournamentCreatedSuccessfully: '锦标赛创建成功',
    pairUpdatedSuccessfully: '组合已成功更新',
    categoryUpdatedSuccessfully: '类别已成功更新',
    matchEndedSuccessfully: '比赛已成功结束',
    tournamentPublishedSuccessfully: '锦标赛已成功发布',
  },
};

const DEFAULT_LOCALE = Locale.VI;

const isLocale = (value: string): value is Locale =>
  (SUPPORTED_LOCALES as readonly string[]).includes(value);

const getCurrentLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const segment = window.location.pathname.split('/')[1];
  if (segment && isLocale(segment)) {
    return segment;
  }

  return DEFAULT_LOCALE;
};

export const getToastMessage = (
  key: ToastMessageKey,
  locale?: string
): string => {
  const resolvedLocale =
    locale && isLocale(locale) ? locale : getCurrentLocale();
  return TOAST_MESSAGES[resolvedLocale][key];
};
