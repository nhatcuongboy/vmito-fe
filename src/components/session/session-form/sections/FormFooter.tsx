import { Flex, Portal } from '@chakra-ui/react';
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
  formId,
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
  formId: string;
}) {
  const actions = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} flex={1}>
          {tc('cancel')}
        </Button>
      )}
      <Button
        type="submit"
        form={formId}
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
    </>
  );

  return (
    <>
      {useDrawerMobileFooter && (
        <Portal>
          <Flex
            display={{ base: 'flex', md: 'none' }}
            gap={3}
            position="fixed"
            insetInlineEnd={0}
            bottom={0}
            width={mobileFooterWidth}
            p={4}
            pb="calc(16px + env(safe-area-inset-bottom))"
            bg={{ base: 'white', _dark: 'gray.800' }}
            borderTop="1px solid"
            borderColor="border"
            boxShadow="0 -8px 24px rgba(0, 0, 0, 0.18)"
            zIndex={1402}
          >
            {actions}
          </Flex>
        </Portal>
      )}
      <Flex
        display={
          useDrawerMobileFooter ? { base: 'none', md: 'flex' } : undefined
        }
        gap={3}
        mt={4}
      >
        {actions}
      </Flex>
    </>
  );
}
