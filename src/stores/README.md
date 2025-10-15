# Zustand Stores - Badminton App

This directory contains the Zustand state management stores for the Badminton App.

## Overview

Zustand is a lightweight state management library that provides:

- Simple and intuitive API
- TypeScript support
- DevTools integration
- Persistence capabilities
- No boilerplate code

## Store Structure

### 1. `useAppStore` - Global Application State

Manages global app-wide state:

- Theme settings (dark mode)
- UI state (sidebar)
- Global loading states
- Error handling

```typescript
import { useAppStore } from '@/stores';

const { isDarkMode, setDarkMode, isLoading, setLoading } = useAppStore();
```

### 2. `useSessionStore` - Session Management

Manages session-specific state:

- Current session data
- Player selections
- Court selections
- Match modes
- Tab navigation

```typescript
import { useSessionStore } from '@/stores';

const {
  selectedPlayers,
  addSelectedPlayer,
  togglePlayerSelection,
  matchMode,
  setMatchMode,
} = useSessionStore();
```

### 3. `useCourtStore` - Court Operations

Manages court-related operations:

- Modal states (auto-assign, manual selection, etc.)
- Loading states for court operations
- Selected courts and matches
- Player selection for specific courts

```typescript
import { useCourtStore } from '@/stores';

const {
  autoAssignModalOpen,
  openAutoAssignModal,
  closeAutoAssignModal,
  toggleManualPlayer,
} = useCourtStore();
```

## Key Features

### DevTools Integration

All stores are configured with Redux DevTools for debugging:

- Action tracking
- State inspection
- Time-travel debugging

### Persistence

The `useSessionStore` persists:

- `activeTab` - Current tab selection
- `matchMode` - Auto or manual match mode

### Type Safety

All stores are fully typed with TypeScript interfaces.

## Migration Guide

### From Prop Drilling to Zustand

**Before:**

```typescript
// Parent component
<ChildComponent
  selectedPlayers={selectedPlayers}
  setSelectedPlayers={setSelectedPlayers}
  matchMode={matchMode}
  setMatchMode={setMatchMode}
/>

// Child component
interface Props {
  selectedPlayers: string[];
  setSelectedPlayers: (players: string[]) => void;
  matchMode: 'auto' | 'manual';
  setMatchMode: (mode: 'auto' | 'manual') => void;
}
```

**After:**

```typescript
// Parent component
<ChildComponent />

// Child component
import { useSessionStore } from '@/stores';

const { selectedPlayers, setSelectedPlayers, matchMode, setMatchMode } = useSessionStore();
```

### From Custom Hooks to Zustand

**Before:**

```typescript
const modals = useCourtsTabModals();
modals.openAutoAssignModal(court);
```

**After:**

```typescript
const { openAutoAssignModal } = useCourtStore();
openAutoAssignModal(court);
```

## Best Practices

### 1. Use Selectors for Performance

```typescript
// ✅ Good - Only subscribe to what you need
const selectedPlayers = useSessionStore((state) => state.selectedPlayers);

// ❌ Avoid - Subscribes to entire store
const store = useSessionStore();
```

### 2. Group Related Actions

```typescript
// Create custom hooks for related actions
function usePlayerSelection() {
  const {
    selectedPlayers,
    addSelectedPlayer,
    removeSelectedPlayer,
    clearSelectedPlayers,
  } = useSessionStore();

  const selectPlayer = (id: string) => {
    if (selectedPlayers.length < 4) {
      addSelectedPlayer(id);
    }
  };

  return { selectedPlayers, selectPlayer, clearSelectedPlayers };
}
```

### 3. Combine Stores When Needed

```typescript
function useMatchCreation() {
  const { setLoading } = useAppStore();
  const { selectedPlayers, selectedCourt } = useSessionStore();
  const { openAutoAssignModal } = useCourtStore();

  const canCreateMatch = selectedPlayers.length === 4 && selectedCourt;

  return { canCreateMatch, openAutoAssignModal };
}
```

## Testing

### Mocking Stores

```typescript
import { useSessionStore } from '@/stores';

jest.mock('@/stores', () => ({
  useSessionStore: jest.fn(() => ({
    selectedPlayers: ['player1', 'player2'],
    addSelectedPlayer: jest.fn(),
    removeSelectedPlayer: jest.fn(),
  })),
}));
```

### Resetting State

```typescript
// Reset store state in tests
beforeEach(() => {
  useSessionStore.getState().clearSelectedPlayers();
});
```

## Performance

Zustand is highly performant:

- Only re-renders components that use changed state
- No unnecessary re-renders
- Minimal bundle size
- No providers needed

## Debugging

Enable Redux DevTools:

1. Install Redux DevTools browser extension
2. Stores are already configured with devtools
3. View state changes in real-time
4. Time-travel debug your application

## Example Implementation

See `examples.ts` for detailed usage examples and migration patterns.
