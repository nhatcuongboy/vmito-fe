'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/primitives/accordion';
import { Button } from '@/components/primitives/button';
import { Input } from '@/components/ui/Input';
import { SUPPORT_CATEGORIES, type TSupportCategoryId } from './support-content';
import { Search, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

type THelpfulnessResponse = 'yes' | 'no';

const normalizeSearchValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLocaleLowerCase()
    .trim();

export default function SupportFaqExplorer() {
  const t = useTranslations('pages.support');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<
    TSupportCategoryId | 'all'
  >('all');
  const [responses, setResponses] = useState<
    Record<string, THelpfulnessResponse>
  >({});

  const filteredCategories = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);

    return SUPPORT_CATEGORIES.map((category) => {
      const faqs = category.faqIds.filter((faqId) => {
        if (!normalizedQuery) return true;
        const searchableText = [
          t(`faqs.${faqId}.question`),
          t(`faqs.${faqId}.answer`),
          t(`faqs.${faqId}.keywords`),
        ]
          .map(normalizeSearchValue)
          .join(' ');
        return searchableText.includes(normalizedQuery);
      });

      return { ...category, faqIds: faqs };
    }).filter(
      (category) =>
        (activeCategory === 'all' || category.id === activeCategory) &&
        category.faqIds.length > 0
    );
  }, [activeCategory, query, t]);

  const visibleFaqCount = filteredCategories.reduce(
    (total, category) => total + category.faqIds.length,
    0
  );

  const clearFilters = () => {
    setQuery('');
    setActiveCategory('all');
  };

  return (
    <section
      aria-labelledby="support-faq-heading"
      className="scroll-mt-24 border-y border-border bg-muted/35 py-12 md:py-16"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold tracking-wide text-green-600 uppercase dark:text-green-400">
            {t('faq.eyebrow')}
          </p>
          <h2
            id="support-faq-heading"
            className="text-3xl! font-bold! md:text-4xl!"
          >
            {t('faq.title')}
          </h2>
          <p className="mt-3 text-muted-foreground">{t('faq.subtitle')}</p>
        </div>

        <div className="relative mx-auto max-w-3xl">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-green-600 dark:text-green-400"
          />
          <Input
            aria-label={t('search.label')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            className="h-14 rounded-2xl border-border bg-background pr-12 pl-12 text-base shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-green-500"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full"
              aria-label={t('search.clear')}
              onClick={() => setQuery('')}
            >
              <X aria-hidden className="size-4" />
            </Button>
          )}
        </div>

        <div
          className="mt-6 flex flex-wrap justify-center gap-2"
          role="group"
          aria-label={t('categories.label')}
        >
          <Button
            type="button"
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
          >
            {t('categories.all')}
          </Button>
          {SUPPORT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <Button
                key={category.id}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                aria-pressed={isActive}
                onClick={() => setActiveCategory(category.id)}
              >
                <Icon aria-hidden className="size-4" />
                {t(`categories.${category.id}.title`)}
              </Button>
            );
          })}
        </div>

        <p
          className="mt-5 text-center text-sm text-muted-foreground"
          aria-live="polite"
        >
          {t('faq.resultCount', { count: visibleFaqCount })}
        </p>

        {visibleFaqCount > 0 ? (
          <div className="mt-8 space-y-6">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <section
                  key={category.id}
                  aria-labelledby={`support-category-${category.id}`}
                  className="rounded-2xl border bg-background p-4 shadow-sm sm:p-6"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div>
                      <h3
                        id={`support-category-${category.id}`}
                        className="font-semibold"
                      >
                        {t(`categories.${category.id}.title`)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(`categories.${category.id}.description`)}
                      </p>
                    </div>
                  </div>

                  <Accordion type="multiple">
                    {category.faqIds.map((faqId) => {
                      const response = responses[faqId];
                      return (
                        <AccordionItem key={faqId} value={faqId}>
                          <AccordionTrigger className="cursor-pointer px-1 text-base font-semibold! hover:no-underline">
                            {t(`faqs.${faqId}.question`)}
                          </AccordionTrigger>
                          <AccordionContent className="px-1 pb-5 text-base leading-relaxed text-muted-foreground">
                            <p>{t(`faqs.${faqId}.answer`)}</p>
                            <div className="mt-5 rounded-xl bg-muted p-4">
                              {response ? (
                                <p
                                  className="text-sm font-medium text-foreground"
                                  role="status"
                                >
                                  {t(
                                    response === 'yes'
                                      ? 'helpfulness.thanksYes'
                                      : 'helpfulness.thanksNo'
                                  )}
                                </p>
                              ) : (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm font-medium text-foreground">
                                    {t('helpfulness.question')}
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setResponses((current) => ({
                                          ...current,
                                          [faqId]: 'yes',
                                        }))
                                      }
                                    >
                                      <ThumbsUp
                                        aria-hidden
                                        className="size-4"
                                      />
                                      {t('helpfulness.yes')}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setResponses((current) => ({
                                          ...current,
                                          [faqId]: 'no',
                                        }))
                                      }
                                    >
                                      <ThumbsDown
                                        aria-hidden
                                        className="size-4"
                                      />
                                      {t('helpfulness.no')}
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {response === 'no' && (
                                <a
                                  href="#support-request"
                                  className="mt-3 inline-flex text-sm font-semibold text-green-700 underline-offset-4 hover:underline dark:text-green-300"
                                >
                                  {t('helpfulness.contactCta')}
                                </a>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-dashed bg-background p-8 text-center">
            <h3 className="font-semibold">{t('search.emptyTitle')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('search.emptyDescription')}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5"
              onClick={clearFilters}
            >
              {t('search.reset')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
