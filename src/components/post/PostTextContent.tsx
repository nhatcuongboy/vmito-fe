import type { ReactNode } from 'react';

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const URL_PART_PATTERN = /^(?:https?:\/\/[^\s]+|www\.[^\s]+)$/i;
const TRAILING_URL_PUNCTUATION = /[.,!?;:]+$/;

interface PostTextContentOptions {
  highlightHashtags?: boolean;
}

function renderPlainText(
  text: string,
  highlightHashtags: boolean
): ReactNode[] {
  if (!highlightHashtags) return [text];

  return text.split(/(#\w+)/g).map((part, index) =>
    part.startsWith('#') ? (
      <span
        key={`${part}-${index}`}
        className="cursor-pointer font-medium text-green-600 hover:underline"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

/** Renders safe, clickable links while preserving the original text and lines. */
export function renderPostText(
  content: string,
  { highlightHashtags = false }: PostTextContentOptions = {}
): ReactNode[] {
  const nodes: ReactNode[] = [];

  content.split(URL_PATTERN).forEach((part, index) => {
    if (!part || !URL_PART_PATTERN.test(part)) {
      nodes.push(
        ...renderPlainText(part, highlightHashtags).map((node, nodeIndex) => (
          <span key={`text-${index}-${nodeIndex}`}>{node}</span>
        ))
      );
      return;
    }

    const trailingPunctuation = part.match(TRAILING_URL_PUNCTUATION)?.[0] ?? '';
    const url = part.slice(0, part.length - trailingPunctuation.length);
    const href = url.startsWith('www.') ? `https://${url}` : url;

    nodes.push(
      <a
        key={`link-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline decoration-blue-400/70 underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {url}
      </a>,
      trailingPunctuation && (
        <span key={`punctuation-${index}`}>{trailingPunctuation}</span>
      )
    );
  });

  return nodes.filter(Boolean);
}
