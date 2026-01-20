'use client';

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { ReactNode } from 'react';

interface IntlClientProviderProps {
  children: ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}

export function IntlClientProvider({
  children,
  messages,
  locale,
}: IntlClientProviderProps) {
  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="Asia/Ho_Chi_Minh"
    >
      {children}
    </NextIntlClientProvider>
  );
}
