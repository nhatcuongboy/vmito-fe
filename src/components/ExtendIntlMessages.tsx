'use client';

import {
  AbstractIntlMessages,
  NextIntlClientProvider,
  useLocale,
  useMessages,
} from 'next-intl';
import { ReactNode, useMemo } from 'react';

interface ExtendIntlMessagesProps {
  children: ReactNode;
  /** Route-scoped subtree, e.g. the result of pickNamespace(all, 'pages.tournaments') */
  messages: AbstractIntlMessages;
}

/**
 * Adds route-scoped messages on top of the ones from the root layout provider.
 * A nested NextIntlClientProvider replaces (not merges) parent messages, so we
 * merge here on the client — this way only the route chunk crosses the RSC
 * boundary instead of duplicating the whole global set.
 */
export function ExtendIntlMessages({
  children,
  messages,
}: ExtendIntlMessagesProps) {
  const locale = useLocale();
  const parent = useMessages();

  const merged = useMemo(() => {
    const result: AbstractIntlMessages = { ...parent };
    for (const [key, value] of Object.entries(messages)) {
      const parentValue = result[key];
      if (
        parentValue &&
        typeof parentValue === 'object' &&
        value &&
        typeof value === 'object'
      ) {
        result[key] = { ...parentValue, ...value };
      } else {
        result[key] = value;
      }
    }
    return result;
  }, [parent, messages]);

  return (
    <NextIntlClientProvider locale={locale} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
