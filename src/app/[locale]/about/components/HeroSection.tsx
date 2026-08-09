'use client';

import { Button } from '@/components/primitives/button';
import { Link } from '@/i18n/config';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowRight, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

export default function HeroSection() {
  const t = useTranslations('pages.about.hero');
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 px-4 pt-6 pb-8 md:pt-12 md:pb-16 dark:from-gray-900 dark:to-green-950">
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <h1 className="text-4xl! leading-[1.1]! font-extrabold! tracking-tight text-green-600 md:text-5xl! dark:text-green-400">
            {t('title')}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-2xl dark:text-gray-300">
            {t('subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
            <Button asChild size="lg" className="h-14 px-8 text-xl">
              <Link href={isAuthenticated ? '/' : '/auth/signin'}>
                {t('cta')}
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 px-8 text-xl"
            >
              <Link href="#how-it-works">
                {t('secondaryCta')}
                <Info aria-hidden className="size-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 hidden size-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,#bbf7d0,transparent_70%)] opacity-60 blur-[60px] lg:block"
          />
          <Image
            src="/hero-illustration.png"
            alt=""
            width={800}
            height={800}
            priority
            className="about-hero-float relative z-10 h-auto max-h-60 w-auto object-contain md:max-h-[360px] lg:max-h-none"
          />
        </div>
      </div>
    </section>
  );
}
