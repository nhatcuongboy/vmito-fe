'use client';

import { RefObject, useEffect, useState } from 'react';

export interface ArticleHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Builds the table of contents from the article body after it renders.
 *
 * The content is editor-authored HTML with no anchor ids, so they are assigned
 * here — derived from the heading text, with an index suffix so two sections
 * sharing a title still get unique anchors.
 */
export function useArticleHeadings(
  bodyRef: RefObject<HTMLElement | null>,
  content: string
): ArticleHeading[] {
  const [headings, setHeadings] = useState<ArticleHeading[]>([]);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll('h2, h3'));
    const collected = elements.map((element, index) => {
      const text = element.textContent?.trim() ?? '';
      const id = `${slugifyHeading(text) || 'section'}-${index}`;
      element.id = id;
      return {
        id,
        text,
        level: element.tagName === 'H3' ? (3 as const) : (2 as const),
      };
    });

    setHeadings(collected.filter((heading) => heading.text.length > 0));
  }, [bodyRef, content]);

  return headings;
}

const slugifyHeading = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
