/**
 * Removes HTML tags from a string.
 * Useful for displaying plain text previews of HTML content.
 *
 * @param html The HTML string to strip
 * @returns Plain text string
 */
export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return '';

  // Replace HTML tags with an empty string
  // Use a regex that handles basic tags
  return html.replace(/<[^>]*>?/gm, '').trim();
};
