# Routes Structure - Visual Guide

## 📊 Application Architecture

```
Badminton Frontend Application
├── Public Routes (Anyone can access)
│   ├── /                                (Home)
│   ├── /about                           (About)
│   ├── /auth/signin                     (Sign In)
│   ├── /auth/signup                     (Sign Up)
│   ├── /browse/tournaments              (Browse Tournaments)
│   └── /join/* routes                   (Join Flow)
│
├── Protected Routes (Authentication Required)
│   ├── /dashboard                       (Role-based Dashboard)
│   └── /settings                        (User Settings)
│
├── Host-Only Routes (/host/*)
│   ├── /host/dashboard                  (Host Dashboard)
│   ├── /host/sessions                   (My Sessions)
│   ├── /host/transactions               (Transactions)
│   ├── /host/payment-settings           (Payment Settings)
│   └── /host/tournaments/*              (Tournament Management)
│
├── Player-Only Routes (/player/*)
│   ├── /player/dashboard                (Player Dashboard)
│   ├── /player/host                     (Become Host)
│   ├── /player/sessions                 (My Sessions)
│   ├── /player/transactions             (Transactions)
│   └── /player/:playerId                (Player Profile)
│
└── Admin-Only Routes (/admin/*)
    ├── /admin/users                     (User Management)
    └── /admin/notifications             (Notifications)
```

---

## 🌳 Session Routes Tree

```
Sessions Management
│
├── Generic Session Routes
│   ├── /sessions/new                    (Create Session)
│   └── /sessions/:id                    (View Session)
│
├── Host Sessions
│   ├── /host/sessions                   (List)
│   ├── /host/sessions/:id               (Manage)
│   │   └── ROUTES.HOST.SESSIONS.DETAIL(id)
│   └── [Related: Tournaments]
│
├── Player Sessions
│   ├── /player/sessions                 (List)
│   ├── /player/sessions/:id             (View)
│   ├── /player/sessions/join/confirm    (Join Confirm)
│   └── [Related: Transactions]
│
└── Browse/Public
    ├── /browse/sessions/:id             (View)
    └── /browse/sessions/:id/join        (Join)
```

---

## 🏆 Tournament Routes Tree

```
Tournament Management
│
├── Host Tournaments (Create & Manage)
│   ├── /host/tournaments/new            (Create)
│   ├── /host/tournaments/:id            (Manage)
│   ├── /host/tournaments/:id/players    (Players)
│   ├── /host/tournaments/:id/pairs      (Pairs)
│   └── /host/tournaments/:id/categories/:categoryId
│
└── Browse Tournaments (View Only)
    ├── /browse/tournaments              (List All)
    ├── /browse/tournaments/:id          (Overview)
    ├── /browse/tournaments/:id/matches  (Matches)
    ├── /browse/tournaments/:id/players  (Players)
    ├── /browse/tournaments/:id/players/:playerId (Player Details)
    ├── /browse/tournaments/:id/events   (Events/Categories)
    ├── /browse/tournaments/:id/winners  (Winners)
    ├── /browse/tournaments/:id/categories/:categoryId
    │
    └── Management Features
        ├── /browse/tournaments/:id/manage (Hub)
        ├── /browse/tournaments/:id/manage/players
        ├── /browse/tournaments/:id/manage/pairs
        └── /browse/tournaments/:id/manage/categories/:categoryId
```

---

## 👥 User Type Routes

```
User Roles & Their Access
│
├── PUBLIC USER (Not Logged In)
│   ├── /                            (Home)
│   ├── /auth/signin                 (Sign In)
│   ├── /auth/signup                 (Sign Up)
│   ├── /browse/tournaments          (Browse)
│   ├── /join/*                      (Join Flow)
│   └── /about                       (About)
│
├── HOST USER (Logged In as Host)
│   ├── /host/dashboard              ✓ Can access
│   ├── /host/sessions               ✓ Can access
│   ├── /host/tournaments/new        ✓ Can create
│   ├── /host/transactions           ✓ Can access
│   ├── /player/*                    ✗ Cannot access
│   └── /admin/*                     ✗ Cannot access (if not admin)
│
├── PLAYER USER (Logged In as Player)
│   ├── /player/dashboard            ✓ Can access
│   ├── /player/sessions             ✓ Can access
│   ├── /player/host                 ✓ Can view
│   ├── /player/transactions         ✓ Can access
│   ├── /host/*                      ✗ Cannot manage (unless host)
│   └── /admin/*                     ✗ Cannot access (if not admin)
│
└── ADMIN USER (Logged In as Admin)
    ├── /admin/users                 ✓ Can access
    ├── /admin/notifications         ✓ Can access
    ├── /host/*                      ✓ Can access (if also host)
    └── /player/*                    ✓ Can access (if also player)
```

---

## 🔐 Access Control Matrix

```
Route Category          Public  Auth  Host   Player  Admin
─────────────────────────────────────────────────────────────
Home                    ✓       ✓     ✓      ✓       ✓
Auth (signin/signup)    ✓       -     -      -       -
Dashboard               -       ✓     ✓      ✓       ✓
Browse Tournaments      ✓       ✓     ✓      ✓       ✓
Host Routes             -       -     ✓      -       ✓*
Player Routes           -       ✓     ✓      ✓       ✓*
Join Flow               ✓       ✓     ✓      ✓       ✓
Guest Routes            ✓       ✓     ✓      ✓       ✓
Admin Routes            -       -     -      -       ✓
Settings                -       ✓     ✓      ✓       ✓

✓ = Can access
- = Cannot access
✓* = Can access if they also have that role
```

---

## 📍 Locale Routing Structure

```
All routes are locale-prefixed:

/{locale}/path

Locales: vi, en, cn
│
├── /vi/                         (Vietnamese)
│   ├── /vi/                     (Home)
│   ├── /vi/dashboard            (Dashboard)
│   ├── /vi/host/sessions        (Host Sessions)
│   └── ...
│
├── /en/                         (English)
│   ├── /en/                     (Home)
│   ├── /en/dashboard            (Dashboard)
│   ├── /en/host/sessions        (Host Sessions)
│   └── ...
│
└── /cn/                         (Chinese)
    ├── /cn/                     (Home)
    ├── /cn/dashboard            (Dashboard)
    ├── /cn/host/sessions        (Host Sessions)
    └── ...
```

---

## 🔄 Join Flow Routing

```
New User/Player Join Journey
│
├── Entry Point
│   └── /join                        (Choose join method)
│
├── Option 1: Join by Registration
│   ├── /join/register               (Registration form)
│   ├── /join/confirm                (Email confirmation)
│   └── /join/status                 (Status check)
│
├── Option 2: Join by Code
│   └── /join-by-code                (Enter session code)
│
└── Guest Join
    ├── /guest/session               (View session as guest)
    └── /guest/join/status           (Join status)
```

---

## 🎯 Breadcrumb Navigation Examples

```
Example 1: Host Session Details
└── Home > Host Sessions > Session #123

Example 2: Tournament Players
└── Home > Browse Tournaments > Tournament #456 > Players

Example 3: Player Profile
└── Home > Players > Player #789

Example 4: Join Confirmation
└── Home > Join > Confirmation

Example 5: Admin Users
└── Home > Admin > Users
```

---

## 📊 Route Statistics by Nesting Level

```
Level 1 (Paths with 1 segment)
└── / (home)
    Total: 1 route

Level 2 (Paths with 2 segments)
├── /auth/*
├── /join/*
├── /host/*
├── /player/*
├── /admin/*
├── /browse/*
├── /guest/*
├── /settings
├── /dashboard
└── /about
   Total: ~20 routes

Level 3 (Paths with 3 segments)
├── /auth/signin
├── /auth/signup
├── /host/dashboard
├── /host/sessions
├── /player/sessions
├── /browse/tournaments
└── ... many more
   Total: ~20 routes

Level 4 (Paths with 4 segments)
├── /host/sessions/:id
├── /host/tournaments/:id
├── /browse/tournaments/:id
├── /player/sessions/:id
└── ... many more
   Total: ~8 routes

Level 5+ (Deep nesting)
├── /host/tournaments/:id/categories/:categoryId
├── /browse/tournaments/:id/players/:playerId
├── /browse/tournaments/:id/manage/categories/:categoryId
└── ... others
   Total: ~3 routes
```

---

## 🔗 Related Routes Groups

```
Session-Related Routes
├── /sessions/new
├── /sessions/:id
├── /host/sessions
├── /host/sessions/:id
├── /player/sessions
├── /player/sessions/:id
├── /browse/sessions/:id
└── /browse/sessions/:id/join

Tournament-Related Routes
├── /host/tournaments/new
├── /host/tournaments/:id/*
├── /browse/tournaments
├── /browse/tournaments/:id/*
└── /browse/tournaments/:id/manage/*

Host-Related Routes
├── /host/dashboard
├── /host/sessions/*
├── /host/transactions
├── /host/payment-settings
└── /host/tournaments/*

Player-Related Routes
├── /player/dashboard
├── /player/host
├── /player/sessions/*
├── /player/transactions
└── /player/:playerId

Join-Related Routes
├── /join
├── /join/register
├── /join/confirm
├── /join/status
├── /join-by-code
├── /guest/session
└── /guest/join/status

Admin-Related Routes
├── /admin/users
└── /admin/notifications

Settings-Related Routes
├── /settings
├── /player-status
└── /about (informational)
```

---

## 🔀 Route Redirects (Legacy Support)

```
Old Route                  Redirects To              Why
──────────────────────────────────────────────────────────
/my-session         →      /guest/session           Route renamed
/join/confirm       →      /player/sessions/join/confirm
/join/status        →      /guest/join/status       Route restructured
/sessions/find      →      /browse/tournaments      Feature moved
/tournaments        →      /browse/tournaments      Clearer naming
/tournaments/new    →      /host/tournaments/new    Better organization
```

---

## 📈 Route Growth Map

```
As the app grows, routes follow this pattern:

Stage 1: Basic Routes
├── / (Home)
├── /auth/signin
├── /auth/signup
└── /about

Stage 2: Add Sessions
├── Previous routes
├── /sessions/new
├── /sessions/:id
└── /host/sessions*

Stage 3: Add Players & Host
├── Previous routes
├── /host/*  (Dashboard, Transactions, etc.)
├── /player/*
└── /guest/*

Stage 4: Add Tournaments
├── Previous routes
├── /host/tournaments/*
├── /browse/tournaments/*
└── Tournament management

Stage 5: Add Admin & Settings
├── Previous routes
├── /admin/*
├── /settings
└── /player-status

Current Status: Stage 5 Complete
Total Routes: 50+
```

---

## 🎓 Understanding Dynamic Routes

```
Static Routes (Fixed URLs)
├── /                    (Always the same)
├── /auth/signin         (Always the same)
├── /settings            (Always the same)
└── /about               (Always the same)

Dynamic Routes (Change based on parameters)
├── /sessions/:id
│   ├── /sessions/123
│   ├── /sessions/456
│   └── /sessions/789
│
├── /player/:playerId
│   ├── /player/user-1
│   ├── /player/user-2
│   └── /player/user-3
│
├── /host/tournaments/:id
│   ├── /host/tournaments/tour-1
│   ├── /host/tournaments/tour-2
│   └── /host/tournaments/tour-3
│
└── /browse/tournaments/:id/categories/:categoryId
    ├── /browse/tournaments/123/categories/men-singles
    ├── /browse/tournaments/123/categories/women-doubles
    └── /browse/tournaments/456/categories/mixed
```

---

## 💡 Key Takeaways

1. **All routes are locale-prefixed** → Always add `/locale` prefix
2. **Clear separation** → `/host/*` vs `/player/*` vs `/browse/*`
3. **Nested organization** → Related routes grouped together
4. **Dynamic routing** → Uses URL parameters for flexible content
5. **Access control** → Routes protected by user role
6. **Backward compatibility** → Old routes redirect to new ones
7. **Scalable structure** → Easy to add new routes as features grow

---

**For detailed examples and usage, see ROUTES_EXAMPLES.tsx**
**For complete reference, see ROUTES_INVENTORY.json**
