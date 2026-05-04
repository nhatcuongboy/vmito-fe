# View Mode URL Synchronization

## Overview

View mode (grid/list/map) is now synchronized with URL parameters across Sessions, Venues, and Clubs pages. This enables:

- **Shareable links** with specific view modes
- **Browser back/forward navigation** support
- **Bookmarkable** page states
- **Consistent UX** across page refreshes

## Implementation

### Hook: `useViewMode`

Located at: `src/hooks/useViewMode.ts`

**Usage:**

```tsx
import { useViewMode } from '@/hooks/useViewMode';

function MyComponent() {
  const [viewMode, setViewMode] = useViewMode('sessions');

  return <button onClick={() => setViewMode('grid')}>Grid View</button>;
}
```

**Priority Chain:**

1. **URL parameter** (`?view=grid`) - highest priority
2. **localStorage** (`view-mode-{scope}`) - fallback
3. **Default value** (`grid`) - final fallback

**Supported Values:**

- `grid` - Grid layout (default)
- `list` - Compact list layout
- `map` - Map view

### Migration from Old Values

Old values are automatically migrated:

- `full` → `grid`
- `compact` → `list`
- `map` → `map` (unchanged)

### URL Format

View mode is stored in the `view` query parameter:

```
/sessions?view=grid
/venues?view=list&city=HCM
/clubs?view=map&search=badminton
```

## Components Updated

### 1. Sessions Page (`FindSessionList`)

- Uses `useViewMode('sessions')`
- Passes props to `ViewModeToggle`
- Renders based on `grid`/`list`/`map`

### 2. Venues Page (`VenueSearchList`)

- Uses `useViewMode('venues')`
- Works with `AppViewModeToggle`
- Fetches `MAP_PAGE_SIZE` for map view

### 3. Clubs Page

- Uses `useViewMode('clubs')`
- Works with `AppViewModeToggle`
- Integrates with filter drawer

### 4. ViewModeToggle Components

- `ViewModeToggle.tsx` - Accepts `viewMode` and `setViewMode` props
- `AppViewModeToggle.tsx` - Uses `useViewMode` hook internally

## Testing Guide

### Manual Testing Checklist

#### URL Synchronization

- [ ] Click view toggle → URL updates with `?view=X`
- [ ] Refresh page → view mode persists
- [ ] Copy URL → paste in new tab → same view mode
- [ ] Browser back/forward → view mode changes correctly

#### Fallback Chain

- [ ] No URL param + has localStorage → uses localStorage value
- [ ] No URL param + no localStorage → defaults to `grid`
- [ ] URL param present → overrides localStorage

#### Cross-Page Consistency

- [ ] Sessions page: Toggle between grid/list/map
- [ ] Venues page: Toggle between grid/list/map
- [ ] Clubs page: Toggle between grid/list/map

#### Filter Integration

- [ ] View mode + search filters work together
- [ ] View mode + pagination work together
- [ ] View mode + sorting work together
- [ ] Changing filters preserves view mode

#### Edge Cases

- [ ] Invalid URL param (`?view=invalid`) → fallback to default
- [ ] Old localStorage values (`full`, `compact`) → migrate correctly
- [ ] Multiple tabs → each maintains independent view mode
- [ ] Map view fetches correct page size (500 items)

### Performance Testing

- [ ] No layout shift when loading page
- [ ] Smooth transitions when toggling view
- [ ] No unnecessary API calls when changing view
- [ ] Map view loads efficiently with large datasets

### Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Deprecation Notice

### `useViewModeStore` (Zustand)

**Status:** Deprecated but kept for backward compatibility

**Migration:**

```tsx
// Old (deprecated)
const { getViewMode, setViewMode } = useViewModeStore();
const viewMode = getViewMode('venues');
setViewMode('venues', 'grid');

// New (recommended)
const [viewMode, setViewMode] = useViewMode('venues');
setViewMode('grid');
```

**Timeline:** Will be removed in a future major version

## Technical Details

### Router Strategy

- Uses `router.replace()` instead of `router.push()`
- Prevents cluttering browser history
- Preserves other query parameters

### localStorage Keys

- Format: `view-mode-{scope}`
- Examples: `view-mode-sessions`, `view-mode-venues`, `view-mode-clubs`

### Performance Optimizations

- `useMemo` for view mode calculation
- `useCallback` for stable setter function
- No re-renders on unrelated URL changes

## Troubleshooting

### View mode not persisting

- Check browser localStorage is enabled
- Verify URL parameter is being set correctly
- Check console for errors

### Migration not working

- Clear localStorage: `localStorage.clear()`
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Map view not loading

- Verify `MAP_PAGE_SIZE` constant is set (500)
- Check API supports large page sizes
- Verify map component receives correct data

## Future Enhancements

Potential improvements:

- [ ] Add view mode preference per user (backend sync)
- [ ] Add transition animations between view modes
- [ ] Support custom view modes per page
- [ ] Add analytics tracking for view mode usage
