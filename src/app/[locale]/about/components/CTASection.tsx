'use client';

import { Button } from '@/components/primitives/button';
import { Link } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CTASection() {
  const t = useTranslations('pages.about.cta');
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="bg-gradient-to-r from-green-600 to-green-400 py-20 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 text-center sm:px-6">
        <h2 className="text-4xl! font-bold! md:text-5xl!">{t('title')}</h2>
        <Button
          asChild
          size="lg"
          className="h-16 bg-background px-10 text-2xl font-bold text-green-600! transition-transform hover:scale-105 hover:bg-gray-100"
        >
          <Link href={isAuthenticated ? '/' : '/auth/signin'}>
            {t('button')}
            <ArrowRight aria-hidden className="size-6" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
