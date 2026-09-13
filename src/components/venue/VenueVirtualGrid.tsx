'use client';

import {
  defaultRangeExtractor,
  useWindowVirtualizer,
  type Range,
  type VirtualItem,
} from '@tanstack/react-virtual';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { Venue } from '@/lib/api/types';
import VenueCard from './VenueCard';

interface Props {
  venues: Venue[];
  variant: 'list' | 'grid';
  listKey: string;
  hasMore: boolean;
  canLoadMore: boolean;
  onLoadMore: () => void;
  onFavoriteChange: (id: string, favorite: boolean) => void;
}

interface ScrollSnapshot {
  offset: number;
  width: number;
  count: number;
  measurements: VirtualItem[];
  updatedAt: number;
}
const scrollSnapshots = new Map<string, ScrollSnapshot>();
const columnsForViewport = () =>
  window.matchMedia('(min-width: 64rem)').matches
    ? 3
    : window.matchMedia('(min-width: 48rem)').matches
      ? 2
      : 1;

export default function VenueVirtualGrid({
  venues,
  variant,
  listKey,
  hasMore,
  canLoadMore,
  onLoadMore,
  onFavoriteChange,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({
    ready: false,
    columns: 1,
    margin: 0,
    estimate: variant === 'list' ? 260 : 600,
  });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const snapshotKey = `${listKey}:${variant}`;
  const snapshot = useRef<ScrollSnapshot | undefined>(undefined);
  const restorationDone = useRef(false);
  const scrollOffset = useRef(0);
  const containerWidth = useRef(0);
  const resizeAnchor = useRef<{ id: string; offset: number } | null>(null);
  const lastAutoLoadOffset = useRef<number | null>(null);
  const latest = useRef({ hasMore, canLoadMore, onLoadMore });
  latest.current = { hasMore, canLoadMore, onLoadMore };
  const focusedIndex = focusedId
    ? venues.findIndex((venue) => venue.id === focusedId)
    : -1;
  const focusedRow =
    focusedIndex < 0 ? -1 : Math.floor(focusedIndex / layout.columns);
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range);
      if (focusedRow >= 0) {
        // Keep the focused row and its keyboard neighbours, even after scrolling
        // it off screen. Tab must never lose its target to virtualization.
        for (
          let index = Math.max(0, focusedRow - 1);
          index <= Math.min(range.count - 1, focusedRow + 1);
          index++
        )
          indexes.push(index);
      }
      return [...new Set(indexes)].sort((a, b) => a - b);
    },
    [focusedRow]
  );
  const getItemKey = useCallback(
    (index: number) =>
      `${layout.columns}:${venues[index * layout.columns]?.id ?? index}`,
    [layout.columns, venues]
  );
  const virtualizer = useWindowVirtualizer({
    count: Math.ceil(venues.length / layout.columns),
    enabled: layout.ready,
    estimateSize: () => layout.estimate,
    getItemKey,
    gap: 16,
    overscan: 2,
    scrollMargin: layout.margin,
    rangeExtractor,
    initialMeasurementsCache: snapshot.current?.measurements,
  });
  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;
  const venuesRef = useRef(venues);
  venuesRef.current = venues;

  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const cached = scrollSnapshots.get(snapshotKey);
    if (
      cached &&
      Date.now() - cached.updatedAt < 5 * 60_000 &&
      cached.width === element.clientWidth &&
      cached.count === venuesRef.current.length
    )
      snapshot.current = cached;
    let previousColumns = columnsForViewport();
    const measure = () => {
      containerWidth.current = element.clientWidth;
      const columns = columnsForViewport();
      if (columns !== previousColumns) {
        const rows = Array.from(
          element.querySelectorAll<HTMLElement>('[data-venue-row]')
        );
        const visible = rows.find(
          (row) => row.getBoundingClientRect().bottom > 90
        );
        const card = visible?.querySelector<HTMLElement>('[data-venue-id]');
        if (visible && card && element.getBoundingClientRect().top < 0)
          resizeAnchor.current = {
            id: card.dataset.venueId!,
            offset: -visible.getBoundingClientRect().top,
          };
        previousColumns = columns;
      }
      const heights = Array.from(
        element.querySelectorAll<HTMLElement>('[data-venue-id]')
      ).map((card) => card.getBoundingClientRect().height);
      const estimate = Math.max(0, ...heights);
      setLayout((previous) => {
        const margin = element.getBoundingClientRect().top + window.scrollY;
        if (
          previous.ready &&
          previous.columns === columns &&
          Math.abs(previous.margin - margin) < 1
        )
          return previous;
        return {
          ready: true,
          columns,
          margin,
          estimate: estimate || previous.estimate,
        };
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.parentElement) observer.observe(element.parentElement);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [snapshotKey]);

  useLayoutEffect(() => {
    if (!layout.ready) return;
    if (!restorationDone.current) {
      restorationDone.current = true;
      if (snapshot.current)
        window.scrollTo({ top: snapshot.current.offset, behavior: 'instant' });
    }
    const anchor = resizeAnchor.current;
    if (anchor) {
      resizeAnchor.current = null;
      const index = venuesRef.current.findIndex(
        (venue) => venue.id === anchor.id
      );
      virtualizer.measure();
      const offset = virtualizer.getOffsetForIndex(
        Math.floor(Math.max(0, index) / layout.columns),
        'start'
      );
      if (offset)
        window.scrollTo({
          top: offset[0] + anchor.offset,
          behavior: 'instant',
        });
    }
  }, [layout.ready, layout.columns, virtualizer]);

  useEffect(() => {
    if (!layout.ready) return;
    let frame = 0;
    const checkEnd = () => {
      frame = 0;
      scrollOffset.current = window.scrollY;
      const {
        hasMore: more,
        canLoadMore: allowed,
        onLoadMore: load,
      } = latest.current;
      if (!more || !allowed || !container.current) return;
      const distance =
        container.current.getBoundingClientRect().bottom - window.innerHeight;
      if (distance > 200 || lastAutoLoadOffset.current === window.scrollY)
        return;
      // A completed request alone cannot trigger another page while the user
      // stands still. A fresh scroll position re-arms this gate.
      lastAutoLoadOffset.current = window.scrollY;
      load();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(checkEnd);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [layout.ready, venues.length, canLoadMore]);

  useEffect(
    () => () => {
      if (!restorationDone.current) return;
      scrollSnapshots.delete(snapshotKey);
      scrollSnapshots.set(snapshotKey, {
        offset: scrollOffset.current,
        width: containerWidth.current,
        count: venuesRef.current.length,
        measurements: [...virtualizerRef.current.measurementsCache],
        updatedAt: Date.now(),
      });
      while (scrollSnapshots.size > 3)
        scrollSnapshots.delete(scrollSnapshots.keys().next().value!);
    },
    [snapshotKey]
  );

  const renderCard = (venue: Venue, index: number) => (
    <div
      key={venue.id}
      data-venue-id={venue.id}
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={venues.length}
    >
      <VenueCard
        venue={venue}
        variant={variant}
        imagePriority={index === 0}
        showVerifiedBadge={false}
        onFavoriteChange={onFavoriteChange}
      />
    </div>
  );

  return (
    <div
      ref={container}
      role="list"
      className={layout.ready ? 'venue-virtual-grid' : 'venue-ssr-grid'}
      data-venue-list
      data-loaded-count={venues.length}
      style={
        layout.ready
          ? {
              height: virtualizer.getTotalSize(),
              position: 'relative',
              overflowAnchor: 'none',
            }
          : undefined
      }
      onFocusCapture={(event) =>
        setFocusedId(
          (event.target as HTMLElement).closest<HTMLElement>('[data-venue-id]')
            ?.dataset.venueId ?? null
        )
      }
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocusedId(null);
      }}
    >
      {layout.ready
        ? virtualizer.getVirtualItems().map((row) => (
            <div
              key={row.key}
              data-index={row.index}
              data-venue-row
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                display: 'grid',
                gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
                gap: 16,
                transform: `translateY(${row.start - layout.margin}px)`,
              }}
            >
              {venues
                .slice(
                  row.index * layout.columns,
                  (row.index + 1) * layout.columns
                )
                .map((venue, index) =>
                  renderCard(venue, row.index * layout.columns + index)
                )}
            </div>
          ))
        : venues.map(renderCard)}
    </div>
  );
}
