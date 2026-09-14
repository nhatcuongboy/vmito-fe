'use client';

import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/primitives/button';
import TopBar from '@/components/ui/TopBar';
import { Link } from '@/i18n/config';
import { TOP_BAR_HEIGHT_DESKTOP, TOP_BAR_HEIGHT_MOBILE } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Facebook,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CSSProperties } from 'react';
import SupportFaqExplorer from './SupportFaqExplorer';
import SupportRequestForm from './SupportRequestForm';

const topBarOffset = {
  '--top-bar-mobile': `${TOP_BAR_HEIGHT_MOBILE}px`,
  '--top-bar-desktop': `${TOP_BAR_HEIGHT_DESKTOP}px`,
} as CSSProperties;

const contactChannels = [
  { id: 'hotline', icon: Phone, href: 'tel:0914810765' },
  { id: 'email', icon: Mail, href: 'mailto:admin@vmito.com' },
  { id: 'zalo', icon: MessageCircle, href: 'https://zalo.me/84914810765' },
  { id: 'messenger', icon: MessageCircle, href: 'https://m.me/vmitovn' },
  { id: 'fanpage', icon: Facebook, href: 'https://www.facebook.com/vmitovn' },
] as const;

export default function SupportClient() {
  const common = useTranslations('common');
  const t = useTranslations('pages.support');
  const { isAuthenticated, accessToken } = useAuthStore();
  const isSignedIn = isAuthenticated && Boolean(accessToken);

  return (
    <PageWrapper>
      <TopBar showBackButton={false} title={common('support')} />
      <main className="top-bar-content-offset" style={topBarOffset}>
        <section className="overflow-hidden bg-gradient-to-br from-green-50 via-background to-emerald-100 px-4 py-12 dark:from-gray-950 dark:via-background dark:to-emerald-950/60 md:py-20">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
            <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-600/25">
              <LifeBuoy aria-hidden className="size-7" />
            </span>
            <p className="text-sm font-semibold tracking-wide text-green-700 uppercase dark:text-green-300">
              {t('hero.eyebrow')}
            </p>
            <h1 className="mt-3 text-4xl! leading-tight! font-extrabold! tracking-tight md:text-5xl!">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
              {t('hero.subtitle')}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <a href="#support-request">
                  <Send aria-hidden className="size-4" />
                  {t('hero.ticketCta')}
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/guide">
                  <BookOpen aria-hidden className="size-4" />
                  {t('hero.guideCta')}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <SupportFaqExplorer />

        <section className="bg-green-700 px-4 py-12 text-white md:py-16">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
            <MessageCircle aria-hidden className="size-9 text-green-100" />
            <div>
              <h2 className="text-3xl! font-bold!">{t('needHelp.title')}</h2>
              <p className="mt-3 text-green-50">{t('needHelp.description')}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="bg-white text-green-700 hover:bg-green-50"
              >
                <a href="#support-request">
                  <Send aria-hidden className="size-4" />
                  {t('needHelp.ticketCta')}
                </a>
              </Button>
              <Button
                asChild
                className="bg-white text-green-700 shadow-sm hover:bg-green-50 hover:text-green-700"
              >
                <a
                  href="https://m.me/vmitovn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden className="size-4" />
                  {t('needHelp.chatCta')}
                  <ExternalLink aria-hidden className="size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="support-request"
          className="scroll-mt-24 px-4 py-12 md:py-16"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold tracking-wide text-green-600 uppercase dark:text-green-400">
                {t('contact.eyebrow')}
              </p>
              <h2 className="mt-2 text-3xl! font-bold!">
                {t('contact.title')}
              </h2>
              <p className="mt-3 text-muted-foreground">
                {t('contact.description')}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {contactChannels.map((channel) => {
                  const Icon = channel.icon;
                  const opensExternal = channel.href.startsWith('http');
                  return (
                    <a
                      key={channel.id}
                      href={channel.href}
                      target={opensExternal ? '_blank' : undefined}
                      rel={opensExternal ? 'noopener noreferrer' : undefined}
                      className="group flex items-center gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/40"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                        <Icon aria-hidden className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {t(`contact.channels.${channel.id}.label`)}
                        </span>
                        <span className="block truncate text-sm text-muted-foreground">
                          {t(`contact.channels.${channel.id}.value`)}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
              <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                {t('contact.owner')}
              </p>
            </div>
            <div>
              <SupportRequestForm />
              {isSignedIn && (
                <Link
                  href="/feedback"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 underline-offset-4 hover:underline dark:text-green-300"
                >
                  {t('ticket.historyCta')}
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </PageWrapper>
  );
}
