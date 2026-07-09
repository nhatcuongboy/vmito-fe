export interface YouTubeEmbed {
  id: string;
  embedUrl: string;
  watchUrl: string;
}

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function getYouTubeVideoId(url: string): string | null {
  const value = url.trim();
  if (!value) return null;

  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }

    if (
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com' ||
      hostname === 'music.youtube.com'
    ) {
      const videoParam = parsed.searchParams.get('v');
      if (videoParam && YOUTUBE_ID_PATTERN.test(videoParam)) {
        return videoParam;
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      const embedIndex = parts.findIndex((part) =>
        ['embed', 'shorts', 'live'].includes(part)
      );
      const id = embedIndex >= 0 ? parts[embedIndex + 1] : null;
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeEmbed(url: string): YouTubeEmbed | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;

  return {
    id,
    embedUrl: `https://www.youtube.com/embed/${id}`,
    watchUrl: `https://www.youtube.com/watch?v=${id}`,
  };
}

export function normalizeYouTubeUrls(urls: string[]): string[] {
  const seen = new Set<string>();

  return urls
    .map((url) => getYouTubeEmbed(url))
    .filter((embed): embed is YouTubeEmbed => !!embed)
    .filter((embed) => {
      if (seen.has(embed.id)) return false;
      seen.add(embed.id);
      return true;
    })
    .map((embed) => embed.watchUrl);
}
