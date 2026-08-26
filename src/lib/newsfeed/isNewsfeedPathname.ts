const NEWSFEED_PATH_PATTERN =
  /^\/(?:[a-z]{2}(?:-[A-Za-z]+)?\/)?newsfeed(?:\/|$)/;

/** Supports both next-intl's normalized pathname and locale-prefixed URLs. */
export function isNewsfeedPathname(pathname: string): boolean {
  return NEWSFEED_PATH_PATTERN.test(pathname);
}
