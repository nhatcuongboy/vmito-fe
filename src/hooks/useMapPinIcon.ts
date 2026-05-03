import { useMemo, useState, useEffect } from 'react';

interface UseMapPinIconOptions {
  /** Pin fill color. Default: '#16a34a' (green) */
  color?: string;
  /** Pin width in pixels. Default: 30 */
  width?: number;
  /** Pin height in pixels. Default: 44 */
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
 * Returns a native-style teardrop Google Maps pin icon built from an inline SVG.
 * Supports customizable color and size.
 */
const useMapPinIcon = ({
  color = '#16a34a',
  width = 30,
  height = 44,
  isLoaded = true,
}: UseMapPinIconOptions = {}): MapPinIconResult => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    // Modern pin: white halo → colored body → white ring → colored center dot
    const svgString =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 44" width="30" height="44">` +
      // White halo (border effect)
      `<path d="M15,0.5C8.1,0.5 1.5,7.1 1.5,14C1.5,23.5 15,43.5 15,43.5C15,43.5 28.5,23.5 28.5,14C28.5,7.1 21.9,0.5 15,0.5Z" fill="white"/>` +
      // Colored body
      `<path d="M15,3C9.48,3 4,8.48 4,14C4,22.5 15,41 15,41C15,41 26,22.5 26,14C26,8.48 20.52,3 15,3Z" fill="${color}"/>` +
      // White ring
      `<circle cx="15" cy="14" r="5.5" fill="white"/>` +
      // Colored center dot
      `<circle cx="15" cy="14" r="2.5" fill="${color}"/>` +
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
