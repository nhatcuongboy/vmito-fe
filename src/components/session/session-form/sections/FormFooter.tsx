import { Flex } from '@chakra-ui/react';
import { Button } from '@/components/ui/chakra-compat';
import { CalendarPlus } from 'lucide-react';
import type { useTranslations } from 'next-intl';

type Translator = ReturnType<typeof useTranslations>;

export function FormFooter({
  t,
  tc,
  onCancel,
  isSubmitting,
  isNavigating,
  isEditMode,
  submitLabel,
  useDrawerMobileFooter,
  mobileFooterWidth,
}: {
  t: Translator;
  tc: Translator;
  onCancel?: () => void;
  isSubmitting: boolean;
  isNavigating: boolean;
  isEditMode: boolean;
  submitLabel: string;
  useDrawerMobileFooter: boolean;
  mobileFooterWidth: string;
}) {
  return (
    <Flex
      gap={3}
      mt={4}
      {...(useDrawerMobileFooter
        ? {
            position: { base: 'fixed', md: 'static' },
            right: { base: 0, md: 'auto' },
            bottom: { base: 0, md: 'auto' },
            width: { base: mobileFooterWidth, md: 'auto' },
            p: { base: 4, md: 0 },
            pb: {
              base: 'calc(16px + env(safe-area-inset-bottom))',
              md: 0,
            },
            bg: { base: 'white', _dark: 'gray.800' },
            borderTop: { base: '1px solid', md: 'none' },
            borderColor: { base: 'border', md: 'transparent' },
            boxShadow: {
              base: '0 -8px 24px rgba(0, 0, 0, 0.18)',
              md: 'none',
            },
            zIndex: 1260,
          }
        : {})}
    >
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} flex={1}>
          {tc('cancel')}
        </Button>
      )}
      <Button
        type="submit"
        data-tour="submit-session"
        colorPalette="green"
        loading={isSubmitting || isNavigating}
        loadingText={
          isNavigating
            ? tc('loading')
            : isEditMode
              ? t('saving')
              : t('creating')
        }
        flex={onCancel ? 1 : undefined}
        w={onCancel ? undefined : 'full'}
      >
        <CalendarPlus size={18} style={{ marginRight: '8px' }} />
        {submitLabel}
      </Button>
    </Flex>
  );
}
