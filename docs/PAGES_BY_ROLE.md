# Danh Sách Pages Theo User Role

Tài liệu này liệt kê tất cả các pages trong ứng dụng, được phân loại theo cấu trúc mới đã được tái cấu trúc.

## User Roles

Hệ thống có 4 loại user role:

```typescript
enum UserRole {
  HOST = 'HOST',      // Người tổ chức session/tournament
  GUEST = 'GUEST',    // Khách (chưa đăng nhập hoặc tạm thời)
  PLAYER = 'PLAYER',  // Người chơi
  ADMIN = 'ADMIN',    // Quản trị viên
}
```

---

## 📋 Route Structure Mới

Cấu trúc URL được tổ chức theo vai trò người dùng để dễ quản lý và mở rộng.

```
/[locale]/
├── browse/ (Public Data - Anyone)
│   ├── /sessions/page.tsx             (/browse/sessions)
│   └── /tournaments/                  (/browse/tournaments)
│       ├── page.tsx                   (List)
│       └── [id]/...                   (Public Detail View)
│
├── guest/ (Guest Users)
│   ├── /session/page.tsx              (/guest/session)
│   └── /join/status/page.tsx          (/guest/join/status)
│
├── player/ (Authenticated Players)
│   ├── /dashboard/page.tsx            (/player/dashboard)
│   ├── /sessions/
│   │   ├── [id]/page.tsx              (/player/sessions/[id])
│   │   └── join/confirm/page.tsx      (/player/sessions/join/confirm)
│
├── host/ (Host & Admin Management)
│   ├── /dashboard/page.tsx            (/host/dashboard)
│   ├── /sessions/                     (/host/sessions)
│   │   ├── page.tsx                   (List)
│   │   ├── new/page.tsx               (Create)
│   │   └── [id]/page.tsx              (Manage)
│   └── /tournaments/                  (/host/tournaments)
│       ├── new/page.tsx               (Create)
│       └── [id]/...                   (Manage Details)
│
├── admin/ (System Admin)
│   └── /users/page.tsx                (/admin/users)
│
└── shared/ (Authenticated Users)
    └── /settings/page.tsx             (/settings)
```

---

## 📋 Chi Tiết Pages Theo Role

### 🔴 ADMIN Role

Pages chỉ dành cho ADMIN hoặc ADMIN quản lý hệ thống:

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/admin/users` | Quản lý người dùng hệ thống | `ADMIN` |
| `/host/dashboard` | Dashboard quản lý (chung với Host) | `ADMIN, HOST` |
| (Truy cập được toàn bộ pages của HOST) |

### 🟢 HOST Role

Pages dành cho HOST để quản lý giải đấu và buổi chơi:

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/host/dashboard` | Dashboard chính của Host | `HOST, ADMIN` |
| `/host/sessions` | Danh sách sessions đang quản lý | `HOST, ADMIN` |
| `/host/sessions/new` | Tạo session mới | `HOST, ADMIN` |
| `/host/sessions/[id]` | Màn hình quản lý chi tiết session | `HOST, ADMIN` |
| `/host/tournaments/new` | Tạo giải đấu mới | `HOST, ADMIN` |
| `/host/tournaments/[id]` | Màn hình quản lý giải đấu | `HOST, ADMIN` |
| `/host/tournaments/[id]/categories/[catId]` | Quản lý hạng mục giải đấu | `HOST, ADMIN` |
| `/host/tournaments/[id]/players` | Quản lý VĐV giải đấu | `HOST, ADMIN` |
| `/host/tournaments/[id]/pairs` | Quản lý cặp đấu giải đấu | `HOST, ADMIN` |

### 🔵 PLAYER Role

Pages dành cho người chơi (PLAYER):

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/player/dashboard` | Dashboard cá nhân của người chơi | `PLAYER` |
| `/player/sessions/[id]` | Xem chi tiết session (View mode) | `PLAYER` |
| `/player/sessions/join/confirm` | Xác nhận tham gia session | `PLAYER` |

### ⚪ GUEST Role

Pages dành cho khách vãng lai hoặc người dùng chưa định danh đầy đủ:

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/guest/session` | Xem thông tin session tạm thời | `GUEST` |
| `/guest/join/status` | Kiểm tra trạng thái tham gia | `GUEST` |

### 🟡 Public Pages (Browse)

Pages công khai, ai cũng có thể xem (nhưng hành động Add/Join sẽ yêu cầu đăng nhập):

| Path | Mô tả |
|------|-------|
| `/` | Trang chủ |
| `/auth/signin` | Đăng nhập |
| `/browse/sessions` | Tìm kiếm buổi chơi |
| `/browse/tournaments` | Tìm kiếm giải đấu |
| `/browse/tournaments/[id]` | Xem thông tin giải đấu |

---

## � Login Redirect Flow

Sau khi đăng nhập thành công, người dùng sẽ được điều hướng như sau:

1. **ADMIN / HOST** -> `/host/dashboard`
2. **PLAYER** -> `/player/dashboard`
3. **GUEST** -> `/guest/session` (hoặc Dashboard tùy cấu hình logic)
4. **Có `callbackUrl`** -> Ưu tiên chuyển hướng về URL trước đó (ví dụ từ trang tìm kiếm session).

---

**Ngày cập nhật**: 2026-01-17
**Trạng thái**: Đã hoàn tất tái cấu trúc (Phase 1, 2, 3 hoàn thành).
