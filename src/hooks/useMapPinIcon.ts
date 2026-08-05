import { useMemo, useState, useEffect } from 'react';

interface UseMapPinIconOptions {
  /** Pin fill color. Default: '#16a34a' (green) */
  color?: string;
  /** Pin width in pixels. Default: 24 */
  width?: number;
  /** Pin height in pixels. Default: 32 */
  height?: number;
  /**
   * Set to the `isLoaded` value from `useJsApiLoader` so the hook waits
   * until the Google Maps API is available before constructing icon objects.
   * Default: true (no waiting).
   */
  isLoaded?: boolean;
}

interface MapPinIconResult {
  /** google.maps.Icon options ready to pass to MarkerF's `icon` prop, or null when not ready */
  iconOptions: google.maps.Icon | null;
}

/**
 * Returns a compact, high-contrast map marker built from an inline SVG.
 */
const useMapPinIcon = ({
  color = '#16a34a',
  width = 24,
  height = 32,
  isLoaded = true,
}: UseMapPinIconOptions = {}): MapPinIconResult => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    // Compact pin: a precise silhouette, slim white keyline and a restrained
    // center dot keep dense map views easy to scan without overwhelming roads.
    const svgString =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32">` +
      `<defs><filter id="s" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity=".24"/></filter></defs>` +
      `<path d="M12 1.5a9.5 9.5 0 0 0-9.5 9.5C2.5 18.1 12 30.5 12 30.5S21.5 18.1 21.5 11A9.5 9.5 0 0 0 12 1.5Z" fill="${color}" stroke="white" stroke-width="2" filter="url(#s)"/>` +
      `<circle cx="12" cy="11" r="3" fill="white"/>` +
      `</svg>`;
    setIconUrl(
      `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`
    );
  }, [isLoaded, color]);

  const iconOptions = useMemo<google.maps.Icon | null>(() => {
    if (!iconUrl || typeof google === 'undefined') return null;
    return {
      url: iconUrl,
      scaledSize: new google.maps.Size(width, height),
      anchor: new google.maps.Point(width / 2, height),
      labelOrigin: new google.maps.Point(width / 2, -12),
    };
  }, [iconUrl, width, height]);

  return { iconOptions };
};

export default useMapPinIcon;
