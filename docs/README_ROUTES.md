# Routes Configuration Documentation

Welcome to the Badminton Frontend Routes Configuration system! This directory contains complete documentation for managing application routes centrally.

## 🚀 Getting Started (Choose Your Level)

### ⚡ Fast Track (2 minutes)

1. Read **[ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)**
2. Look at first example in **[ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)**
3. Start using `import { ROUTES } from '@/constants'` in your code

### 📖 Standard Path (15 minutes)

1. Read **[ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)** (2 min)
2. Scan **[ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)** (8 min)
3. Review **[ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)** (5 min)
4. Start developing!

### 🎓 Complete Learning (1 hour)

1. Read **[ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)** (2 min)
2. Read **[ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)** (10 min)
3. Study **[ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)** (10 min)
4. Review all **[ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)** (20 min)
5. Reference **[ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)** (5 min)
6. Read **[ROUTES.md](./ROUTES.md)** (10 min)

---

## 📚 File Guide

### Core Documentation

**[ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)** - START HERE

- 2-minute quick start
- Import and use examples
- All route categories at a glance
- Common tasks
- Tips and tricks

**[ROUTES.md](./ROUTES.md)** - Complete Reference

- Full API documentation
- All constants explained
- Detailed usage patterns
- How to add new routes
- Best practices
- Troubleshooting

**[ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)** - Deep Dive

- Architecture overview
- File structure explanation
- Statistics and metrics
- Feature breakdown
- Integration points
- Version history

**[ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)** - Visual Guide

- Route hierarchy trees
- User access matrix
- Nesting levels
- Breadcrumb examples
- Route relationships
- Growth roadmap

### Code & Reference

**[ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)** - Production Examples

- 14+ real-world code examples
- Copy-paste ready patterns
- Common use cases
- Best practices in code

**[ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)** - JSON Reference

- All 50+ routes documented
- Metadata for each route
- Statistics and categories
- Dynamic segments
- Redirects mapping

### Navigation

**[INDEX.md](./INDEX.md)** - Documentation Index

- Which document to read for what
- File descriptions
- Learning paths
- FAQ
- Statistics

**[COMPLETION_REPORT.md](./COMPLETION_REPORT.md)** - Project Summary

- What was created
- Statistics
- Quality checklist
- Next steps
- Status: Production Ready ✅

---

## 🎯 Quick Reference

### Import Routes

```typescript
import { ROUTES } from '@/constants';
```

### Basic Usage

```typescript
<Link href={ROUTES.HOME}>Home</Link>
<Link href={ROUTES.HOST.SESSIONS.DETAIL(id)}>View Session</Link>
```

### Check Access

```typescript
import { routeHelpers } from '@/constants';

if (routeHelpers.isProtected(pathname)) {
  /* ... */
}
if (routeHelpers.isHostOnly(pathname)) {
  /* ... */
}
```

### Use Groups

```typescript
import { ROUTE_GROUPS } from '@/constants';

const canAccess = ROUTE_GROUPS.HOST_ONLY.includes(route);
```

### Breadcrumbs

```typescript
import { BREADCRUMB_LABELS } from '@/constants';

const label = BREADCRUMB_LABELS[route];
```

---

## 📊 What's Included

### Routes Configuration

- ✅ 50+ routes organized by feature
- ✅ Type-safe with TypeScript
- ✅ Helper functions included
- ✅ Access control patterns
- ✅ Breadcrumb labels
- ✅ Legacy route redirects
- ✅ Locale support (vi, en, cn)

### Documentation

- ✅ 7 comprehensive guides
- ✅ 90+ KB of documentation
- ✅ 14+ code examples
- ✅ JSON reference
- ✅ Visual diagrams
- ✅ Quick start guide
- ✅ Troubleshooting guide

### Developer Experience

- ✅ IDE autocomplete support
- ✅ Type safety
- ✅ No hardcoded URLs
- ✅ Easy to maintain
- ✅ Easy to extend
- ✅ Well documented
- ✅ Production ready

---

## 📖 Document Matrix

| Document              | Type      | Size   | Read Time | Best For        |
| --------------------- | --------- | ------ | --------- | --------------- |
| ROUTES_QUICKSTART.md  | Guide     | 8.8 KB | 2 min     | Getting started |
| ROUTES.md             | Reference | 8.3 KB | 15 min    | Complete API    |
| ROUTES_SUMMARY.md     | Overview  | 13 KB  | 10 min    | Architecture    |
| ROUTES_STRUCTURE.md   | Visual    | 13 KB  | 10 min    | Understanding   |
| ROUTES_EXAMPLES.tsx   | Code      | 14 KB  | 20 min    | Implementation  |
| ROUTES_INVENTORY.json | Data      | 14 KB  | 5 min     | Reference       |
| INDEX.md              | Index     | 8.7 KB | 3 min     | Navigation      |

---

## 🔑 Key Constants

### ROUTES

```typescript
ROUTES.HOME
ROUTES.AUTH.*
ROUTES.SESSIONS.*
ROUTES.HOST.*
ROUTES.PLAYER.*
ROUTES.BROWSE.*
ROUTES.ADMIN.*
// ... 50+ more
```

### ROUTE_GROUPS

```typescript
ROUTE_GROUPS.PROTECTED; // Auth required
ROUTE_GROUPS.PUBLIC; // Anyone
ROUTE_GROUPS.HOST_ONLY; // Host users
ROUTE_GROUPS.PLAYER_ONLY; // Player users
ROUTE_GROUPS.ADMIN_ONLY; // Admin users
```

### routeHelpers

```typescript
isProtected(pathname);
isPublic(pathname);
isHostOnly(pathname);
isPlayerOnly(pathname);
isAdminOnly(pathname);
getBaseRoute(pathname);
```

### Utilities

```typescript
BREADCRUMB_LABELS;
ROUTE_REDIRECTS;
withLocale(locale, path);
removeLocale(pathname);
```

---

## 📋 Route Categories

```
Total: 50+ routes across 9 categories

📍 Root Routes (2)
   / · /dashboard

🔐 Authentication (3)
   /auth/signin · /auth/signup · /auth/callback

🏸 Sessions (9)
   /sessions/* · /host/sessions/* · /player/sessions/* · /browse/sessions/*

🏆 Tournaments (18)
   /host/tournaments/* · /browse/tournaments/* (with subcategories)

👤 Host (3)
   /host/dashboard · /host/transactions · /host/payment-settings

🎾 Player (4)
   /player/dashboard · /player/host · /player/sessions · /player/transactions

📝 Join (5)
   /join · /join/register · /join/confirm · /join/status · /join-by-code

👥 Guest (2)
   /guest/session · /guest/join/status

⚙️ Admin (2)
   /admin/users · /admin/notifications

📋 Other (3)
   /settings · /player-status · /about
```

---

## ✅ Quality Checklist

- ✅ All 50+ routes documented
- ✅ Type-safe implementation
- ✅ Helper functions
- ✅ Access control patterns
- ✅ Breadcrumb support
- ✅ Locale support
- ✅ Legacy redirects
- ✅ 14+ code examples
- ✅ Complete JSON reference
- ✅ Visual diagrams
- ✅ Quick start guide
- ✅ Troubleshooting guide

---

## 🚀 Next Steps

1. **Read ROUTES_QUICKSTART.md** (2 min)
2. **Import ROUTES in your components** (1 min)
3. **Replace hardcoded URLs** with route constants
4. **Use route helpers** for access control
5. **Add breadcrumbs** to pages
6. **Explore examples** for advanced patterns

---

## ❓ Questions?

### "How do I use routes?"

→ See [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md) or [ROUTES.md](./ROUTES.md)

### "Need code examples?"

→ Check [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)

### "How do I add new routes?"

→ Read "Adding New Routes" in [ROUTES.md](./ROUTES.md)

### "What's the complete structure?"

→ Study [ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)

### "Need JSON reference?"

→ Look at [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)

### "How is it organized?"

→ Read [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)

### "Which file should I read?"

→ Check [INDEX.md](./INDEX.md)

---

## 📊 Statistics

| Metric              | Count  |
| ------------------- | ------ |
| Total Routes        | 50+    |
| Protected Routes    | 21     |
| Public Routes       | 29     |
| Route Categories    | 9      |
| Helper Functions    | 6      |
| Export Constants    | 7      |
| Code Examples       | 14+    |
| Documentation Files | 8      |
| Total Lines of Code | 4000+  |
| Total Documentation | 90+ KB |

---

## ✨ Features

✅ **Centralized** - All routes in one file
✅ **Type-Safe** - TypeScript support with autocomplete
✅ **Organized** - Routes grouped by feature and access
✅ **Documented** - 8 comprehensive guides
✅ **Practical** - 14+ real-world examples
✅ **Scalable** - Easy to add new routes
✅ **Accessible** - Helper functions for common tasks
✅ **Complete** - 50+ routes fully documented

---

## 🎓 Learning Paths

### Path 1: Just Getting Started (5 min)

1. ROUTES_QUICKSTART.md

### Path 2: Intermediate (30 min)

1. ROUTES_QUICKSTART.md (2 min)
2. ROUTES_STRUCTURE.md (8 min)
3. ROUTES_EXAMPLES.tsx (20 min)

### Path 3: Complete Expert (1 hour)

1. ROUTES_QUICKSTART.md
2. ROUTES_SUMMARY.md
3. ROUTES_STRUCTURE.md
4. ROUTES_EXAMPLES.tsx
5. ROUTES.md
6. ROUTES_INVENTORY.json

---

## 🔄 Current Routes Status

- ✅ All 50+ routes catalogued
- ✅ All documented with examples
- ✅ All accessible via type-safe constants
- ✅ Access control configured
- ✅ Breadcrumbs mapped
- ✅ Legacy redirects added
- ✅ Locale support included
- ✅ Production ready

---

## 📞 Support Resources

1. **Quick Start**: [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md)
2. **Complete Guide**: [ROUTES.md](./ROUTES.md)
3. **Code Examples**: [ROUTES_EXAMPLES.tsx](./ROUTES_EXAMPLES.tsx)
4. **Visual Guide**: [ROUTES_STRUCTURE.md](./ROUTES_STRUCTURE.md)
5. **Architecture**: [ROUTES_SUMMARY.md](./ROUTES_SUMMARY.md)
6. **Reference**: [ROUTES_INVENTORY.json](./ROUTES_INVENTORY.json)
7. **Navigation**: [INDEX.md](./INDEX.md)

---

**Start with [ROUTES_QUICKSTART.md](./ROUTES_QUICKSTART.md) - it takes only 2 minutes!**

Happy routing! 🏸

_Status: ✅ Production Ready_
_Last Updated: 2026-02-03_
