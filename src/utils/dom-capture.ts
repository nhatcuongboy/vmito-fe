/**
 * Shared helpers for the DOM -> PNG exports (session stats table, share cards,
 * achievement cards). Kept out of the hooks so both capture hooks behave
 * identically across devices.
 */

// Covers iPhone/iPod/iPad, including iPadOS 13+ which reports as MacIntel
export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// WebKit engines (all iOS browsers + desktop Safari) need a warm-up render
// before images come out correctly; Chromium/Firefox don't
export const needsWarmupRender = () =>
  isIOS() ||
  (typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent));

export const getElementCaptureSize = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(
    rect.width || element.scrollWidth || element.offsetWidth
  );
  const height = Math.ceil(
    rect.height || element.scrollHeight || element.offsetHeight
  );

  return {
    width: width > 0 ? width : undefined,
    height: height > 0 ? height : undefined,
  };
};

// Replaced elements are sized by their own content: dropping the pinned height
// would let the intrinsic aspect ratio resize them and break the layout
const FIXED_HEIGHT_TAGS = new Set([
  'img',
  'svg',
  'canvas',
  'video',
  'iframe',
  'input',
  'textarea',
  'select',
  'br',
  'hr',
]);

/**
 * A `lineClamp` box computes its `display` back to `flow-root`, so the clone
 * receives `-webkit-line-clamp` without the `-webkit-box` display that drives
 * it. The clamp is then inert and the text is only cut by the frozen height —
 * no ellipsis. Putting the display back makes the clamp render its "…" in the
 * exported image, the same as on screen.
 */
const restoreLineClamp = (style: CSSStyleDeclaration) => {
  const clamp = style.getPropertyValue('-webkit-line-clamp');
  if (!clamp || clamp === 'none') return;
  if (style.getPropertyValue('-webkit-box-orient') !== 'vertical') return;

  style.setProperty('display', '-webkit-box');
};

const resolveLineHeight = (style: CSSStyleDeclaration) => {
  const lineHeight = parseFloat(style.lineHeight);
  if (!Number.isNaN(lineHeight)) return lineHeight;

  // `normal` — approximate with the typical ~1.2-1.3em most fonts report
  const fontSize = parseFloat(style.fontSize);
  return Number.isNaN(fontSize) ? 0 : fontSize * 1.3;
};

/**
 * Text that fits on one line in the live DOM must stay on one line in the
 * capture. Its box is frozen to the exact width the text measured, so text
 * that renders a hair wider (see below) wraps onto a second line the box has
 * no room for — pushing or overlapping everything under it. Pinning it to
 * `nowrap` costs a few pixels of harmless horizontal overflow instead.
 *
 * Boxes that already wrap onto several lines are left alone: they are meant to
 * reflow, and the height relaxation below gives them room.
 */
const pinSingleLineText = (
  element: HTMLElement,
  style: CSSStyleDeclaration,
  height: number
) => {
  // Chrome reports the `white-space` longhands rather than the shorthand, and
  // only the ones that differ from the tag default get copied — so check each
  // instead of trusting the shorthand getter. Leave `pre*` text alone: the
  // `white-space: nowrap` set below would also collapse its whitespace.
  if (style.whiteSpace && style.whiteSpace !== 'normal') return;
  const collapse = style.getPropertyValue('white-space-collapse');
  if (collapse && collapse !== 'collapse') return;
  const wrapMode = style.getPropertyValue('text-wrap-mode');
  if (wrapMode && wrapMode !== 'wrap') return;

  const hasOwnText = Array.from(element.childNodes).some(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
  );
  if (!hasOwnText) return;

  const lineHeight = resolveLineHeight(style);
  if (!lineHeight || height > lineHeight * 1.5) return;

  style.setProperty('white-space', 'nowrap');
};

/**
 * modern-screenshot clones the node and freezes every element's *measured*
 * width and height as inline styles, then renders that clone inside an SVG
 * `foreignObject`. Text is re-laid out during that render, and some devices
 * (WebKit synthesising bold, a different system-font resolution) measure it a
 * few pixels wider than the live DOM did. A shrink-to-fit line of text then
 * wraps onto a second line inside a box whose height is frozen to one line,
 * and the overflow paints on top of whatever comes next — e.g. the session
 * name spilling over the time/venue row of the exported stats image.
 *
 * Turning the frozen height into a minimum keeps identical output when nothing
 * reflows, and makes any reflow push the following content down instead of
 * overlapping it. Also restores line clamps (see above) on the way through.
 */
export const normalizeClonedNode = (cloned: Node) => {
  if (cloned.nodeType !== Node.ELEMENT_NODE) return;

  const element = cloned as HTMLElement;
  const style = element.style;
  if (!style) return;
  restoreLineClamp(style);
  if (FIXED_HEIGHT_TAGS.has(element.tagName.toLowerCase())) return;

  const height = style.height;
  if (!height || height === 'auto') return;

  pinSingleLineText(element, style, parseFloat(height));

  // A clipping box states that its content is meant to be cut off, not to
  // resize it — cover-photo crops, clamped descriptions, fixed-height card
  // sections. Growing those would push the rest of the card out of frame.
  const clips = `${style.overflow} ${style.overflowX} ${style.overflowY}`;
  if (clips.includes('hidden') || clips.includes('clip')) return;

  style.removeProperty('height');
  style.removeProperty('block-size');
  // Declared after the logical shorthand so `min-block-size: auto` (also
  // copied from the computed style) can't win the cascade over it
  style.removeProperty('min-block-size');
  style.setProperty('min-height', height);
};
