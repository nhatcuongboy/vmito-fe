# Badminton Frontend Documentation Index

## 📚 Routes Configuration Documentation

Complete guides for managing application routes centrally.

### 🚀 Quick Start

**Start here if you're new to the routes system**

- [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md) - 2-minute quick start guide
  - Basic usage
  - Common tasks
  - Quick tips
  - Next steps

### 📖 Complete Guides

**Detailed documentation for reference**

1. **[ROUTES.md](./ROUTES.md)** - Complete Usage Guide
   - Full API reference
   - All constants documented
   - Usage examples for each section
   - How to add new routes
   - Best practices
   - Tips & tricks

2. **[ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)** - Architecture Overview
   - Project overview
   - File structure
   - Statistics and summary
   - Key features
   - Integration points
   - Troubleshooting guide

3. **[ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)** - Visual Architecture
   - Visual route hierarchy
   - User type access matrix
   - Breadcrumb examples
   - Route relationship diagrams
   - Growth roadmap

### 💻 Code Examples

**Practical code examples for common scenarios**

- [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) - 14+ Real-World Examples
  - Navigation links
  - Dynamic routes
  - Card navigation
  - Tournament navigation
  - Route guards
  - Role-based access control
  - Breadcrumbs
  - Conditional menus
  - Form redirects
  - Locale-aware routing
  - Route-based filtering
  - Access control lists
  - Sidebar navigation
  - Tab navigation

### 📊 Reference

**Complete inventory and specifications**

- [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json) - JSON Inventory
  - All 50+ routes with metadata
  - Complete statistics
  - Route categories
  - Dynamic segments
  - Redirects mapping
  - Export constants list

---

## 🎯 Which Document Should I Read?

### "I just want to use routes"

→ Read **[ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)** (2 min)

### "I need to understand how it works"

→ Read **[ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)** (10 min)

### "I need code examples"

→ Look at **[ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)** (5 min per example)

### "I need to add new routes"

→ See section in **[ROUTES.md](./ROUTES.md)** (3 min)

### "I need complete reference"

→ Check **[ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)** (reference)

### "I want to understand the architecture"

→ Study **[ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)** (10 min)

---

## 📦 What Was Created

### Core Files

- **`src/constants/routes.ts`** - Main configuration (all routes)
- **`src/constants/index.ts`** - Updated to export routes

### Documentation Files

- **ROUTES_QUICKSTART.md** - Quick start guide
- **ROUTES.md** - Complete usage guide
- **ROUTES_SUMMARY.md** - Architecture overview
- **ROUTES_STRUCTURE.md** - Visual diagrams
- **ROUTES_INVENTORY.json** - JSON reference
- **ROUTES_EXAMPLES.tsx** - Code examples
- **INDEX.md** - This file

---

## ⚡ Common Tasks Quick Links

| Task                        | See This                                                             | Time  |
| --------------------------- | -------------------------------------------------------------------- | ----- |
| Use ROUTES in a link        | [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)                       | 1 min |
| Check if route is protected | [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) - Example 6             | 2 min |
| Add breadcrumbs             | [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) - Example 7             | 2 min |
| Create navigation menu      | [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) - Example 8             | 3 min |
| Add new route               | [ROUTES.md](./ROUTES.md) - Adding New Routes section                 | 3 min |
| Find all host routes        | [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)                     | 1 min |
| Understand access control   | [ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md) - Access Control Matrix | 3 min |

---

## 🔑 Key Concepts

### ROUTES

Main constant containing all application routes:

```typescript
import { ROUTES } from '@/constants';

ROUTES.HOME; // '/'
ROUTES.HOST.SESSIONS.LIST; // '/host/sessions'
ROUTES.HOST.SESSIONS.DETAIL(id); // '/host/sessions/:id'
```

### ROUTE_GROUPS

Pre-organized groups for access control:

```typescript
ROUTE_GROUPS.PROTECTED; // Routes requiring auth
ROUTE_GROUPS.HOST_ONLY; // Host-only routes
ROUTE_GROUPS.PLAYER_ONLY; // Player-only routes
```

### routeHelpers

Utility functions for route checking:

```typescript
routeHelpers.isProtected(pathname);
routeHelpers.isHostOnly(pathname);
routeHelpers.isPlayerOnly(pathname);
```

### Dynamic Routes

Functions for parameterized routes:

```typescript
ROUTES.HOST.SESSIONS.DETAIL(sessionId);
ROUTES.BROWSE.TOURNAMENTS.DETAIL(tournamentId);
ROUTES.PLAYER.PROFILE(playerId);
```

---

## 📊 Statistics

| Metric                  | Value          |
| ----------------------- | -------------- |
| **Total Pages**         | 50+            |
| **Protected Routes**    | 21             |
| **Public Routes**       | 29             |
| **Host-only Routes**    | 8              |
| **Player-only Routes**  | 7              |
| **Admin Routes**        | 2              |
| **Supported Locales**   | 3 (vi, en, cn) |
| **Documentation Files** | 7              |
| **Code Examples**       | 14+            |
| **Export Constants**    | 7              |

---

## 🎓 Learning Path

### Level 1: Basics (5-10 minutes)

1. Read [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)
2. Look at first 3 examples in [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)
3. Try using ROUTES in a component

### Level 2: Intermediate (20-30 minutes)

1. Read [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)
2. Study [ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)
3. Try 5-7 more examples
4. Add a new route

### Level 3: Advanced (30+ minutes)

1. Read complete [ROUTES.md](./ROUTES.md)
2. Study all 14+ examples
3. Review [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)
4. Implement complex routing scenarios
5. Contribute to routing system

---

## 🛠️ Integration Checklist

- [ ] Read ROUTES_QUICKSTART.md
- [ ] Import ROUTES in your components
- [ ] Replace hardcoded URLs with ROUTES constants
- [ ] Add breadcrumb labels to pages
- [ ] Use routeHelpers for access control
- [ ] Implement route guards in middleware
- [ ] Add navigation menus using ROUTE_GROUPS
- [ ] Test dynamic routes with IDs
- [ ] Verify breadcrumbs work correctly
- [ ] Add new routes following the guidelines

---

## ❓ FAQ

**Q: Where are all the routes defined?**
A: In `src/constants/routes.ts` - see [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json) for complete list

**Q: How do I use routes in my component?**
A: See [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md) or [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)

**Q: How do I add a new route?**
A: See "Adding New Routes" section in [ROUTES.md](./ROUTES.md)

**Q: What's the difference between ROUTES and ROUTE_GROUPS?**
A: ROUTES = all individual routes, ROUTE_GROUPS = pre-grouped routes by access level. See [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)

**Q: How do I check if a route is protected?**
A: Use `routeHelpers.isProtected(pathname)` - see [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) Example 6

**Q: How do I handle locale routing?**
A: Use `withLocale(locale, path)` and `removeLocale(pathname)` - see [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) Example 10

**Q: What's the complete route structure?**
A: See [ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md) for visual diagrams

---

## 🚀 Next Steps

1. **Start using routes**: Use `import { ROUTES } from '@/constants'` in components
2. **Explore examples**: Check [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)
3. **Add breadcrumbs**: Implement using [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx) Example 7
4. **Implement guards**: Use routeHelpers in middleware
5. **Add new routes**: Follow guidelines in [ROUTES.md](./ROUTES.md)

---

## 📞 Support

- **Questions about usage?** → Check [ROUTES.md](./ROUTES.md)
- **Need code examples?** → See [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)
- **Want complete reference?** → Look at [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)
- **Need architecture overview?** → Read [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)
- **Want visual diagrams?** → Study [ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)

---

## 📝 Document Versions

| Document              | Type      | Lines | Updated    |
| --------------------- | --------- | ----- | ---------- |
| ROUTES_QUICKSTART.md  | Guide     | 300+  | 2026-02-03 |
| ROUTES.md             | Reference | 600+  | 2026-02-03 |
| ROUTES_SUMMARY.md     | Overview  | 800+  | 2026-02-03 |
| ROUTES_STRUCTURE.md   | Visual    | 500+  | 2026-02-03 |
| ROUTES_INVENTORY.json | Reference | 400+  | 2026-02-03 |
| ROUTES_EXAMPLES.tsx   | Examples  | 700+  | 2026-02-03 |
| INDEX.md              | Index     | 300+  | 2026-02-03 |

---

## ✨ Features at a Glance

✅ 50+ routes organized and documented
✅ Type-safe route references
✅ Helper functions for common tasks
✅ Access control patterns
✅ Breadcrumb integration
✅ Locale support
✅ Legacy route redirects
✅ 14+ code examples
✅ Complete JSON inventory
✅ Visual architecture diagrams
✅ Quick start guide
✅ Troubleshooting guide

---

**Happy routing! 🏸**

_Last updated: 2026-02-03_
_Framework: Next.js 13+ (App Router)_
_Status: ✅ Production Ready_
