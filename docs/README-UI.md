# Frontend UI Components Guide

**Last Updated**: January 22, 2026  
**Framework**: Next.js 15 with App Router  
**UI Library**: Chakra UI v3

---

## Route Structure

See [PAGES_BY_ROLE.md](./PAGES_BY_ROLE.md) for complete route documentation.

```
/[locale]/
├── auth/signin, auth/signup       # Authentication
├── host/                          # Host management
│   ├── dashboard                  # Host dashboard
│   ├── sessions/                  # Session list, create, manage
│   └── tournaments/               # Tournament management
├── player/                        # Player views
│   └── sessions/[id]              # Player session view
├── guest/                         # Guest flow
│   └── join/status                # Guest status page
└── browse/                        # Public browsing
    └── sessions, tournaments
```

---

## Core Components

### Layout Components

| Component     | Path                                | Description       |
| ------------- | ----------------------------------- | ----------------- |
| `MainLayout`  | `components/layout/MainLayout.tsx`  | Main page wrapper |
| `TopBar`      | `components/layout/TopBar.tsx`      | Navigation header |
| `SidebarMenu` | `components/layout/SidebarMenu.tsx` | Side navigation   |

### UI Components (`components/ui/`)

| Component          | Description                        |
| ------------------ | ---------------------------------- |
| `CommonModal`      | Standardized modal with animations |
| `Avatar`           | User avatar with fallback          |
| `LanguageSwitcher` | i18n language selector             |
| `PasswordInput`    | Password with visibility toggle    |

### Session Components (`components/session/`)

| Component             | Description            |
| --------------------- | ---------------------- |
| `PlayersTab`          | Player grid/list views |
| `CourtsTab`           | Court management       |
| `MatchesTab`          | Match history          |
| `SessionStatusHeader` | Session status display |

### Player Components (`components/player/`)

| Component           | Description          |
| ------------------- | -------------------- |
| `PlayerGrid`        | Grid view of players |
| `PlayerList`        | List view of players |
| `PlayerDetailModal` | Player info modal    |
| `PlayerManagement`  | Add/edit players     |
| `AddPlayerModal`    | Add new player       |
| `EditPlayerModal`   | Edit existing player |

### Court Components (`components/court/`)

| Component                  | Description                |
| -------------------------- | -------------------------- |
| `CourtCard`                | Court status card          |
| `ManualSelectPlayersModal` | Manual player selection    |
| `MatchPreviewModal`        | Match preview before start |
| `MatchResultModal`         | End match with score       |

### Guards (`components/guards/`)

| Component             | Description                |
| --------------------- | -------------------------- |
| `ProtectedRouteGuard` | Requires authentication    |
| `PublicRouteGuard`    | Redirects if authenticated |

---

## State Management

### Zustand Stores (`stores/`)

| Store             | Purpose              |
| ----------------- | -------------------- |
| `useAuthStore`    | Authentication state |
| `useSessionStore` | Current session data |

---

## Internationalization

See [README-I18N.md](./README-I18N.md) for i18n documentation.

- **Locales**: English (en), Vietnamese (vi), Chinese (cn)
- **Hook**: `useTranslations('scope')`
- **Files**: `src/i18n/messages/*.json`

---

## Styling

- **Chakra UI v3**: Component library
- **CSS**: Custom styles in `src/app/globals.css`
- **Theme**: Extended in `src/theme/`

---

## Key Patterns

### Modal Pattern

```tsx
import { CommonModal } from '@/components/ui/CommonModal';

<CommonModal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  primaryLabel="Confirm"
  onPrimaryClick={handleConfirm}
/>;
```

### Translation Pattern

```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('SessionDetail');
return <h1>{t('title')}</h1>;
```

### Protected Route Pattern

```tsx
<ProtectedRouteGuard requiredRole={['HOST', 'ADMIN']}>
  <HostDashboard />
</ProtectedRouteGuard>
```
