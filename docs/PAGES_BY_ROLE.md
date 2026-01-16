# Danh Sách Pages Theo User Role

Tài liệu này liệt kê tất cả các pages trong ứng dụng, được phân loại theo user role có quyền truy cập.

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

## 📋 Pages Theo Role

### 🔴 ADMIN Role

Pages chỉ dành cho ADMIN hoặc ADMIN + HOST:

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/admin/users` | Quản lý người dùng | `ADMIN` |
| `/host/sessions` | Danh sách sessions | `ADMIN, HOST` |
| `/host/sessions/new` | Tạo session mới | `ADMIN, HOST` |
| `/host/sessions/[id]` | Chi tiết session (host view) | `ADMIN, HOST` |
| `/tournaments/new` | Tạo tournament mới | `HOST` (có thể ADMIN) |
| `/tournaments/[id]/manage` | Quản lý tournament | `ADMIN, HOST` |
| `/tournaments/[id]/manage/categories/[categoryId]` | Quản lý category | `ADMIN, HOST` |
| `/tournaments/[id]/manage/pairs` | Quản lý pairs | `ADMIN, HOST` |
| `/tournaments/[id]/manage/players` | Quản lý players | `ADMIN, HOST` |

---

### 🟢 HOST Role

Pages dành cho HOST (và thường cả ADMIN):

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/host/sessions` | Danh sách sessions của host | `ADMIN, HOST` |
| `/host/sessions/new` | Tạo session mới | `ADMIN, HOST` |
| `/host/sessions/[id]` | Quản lý session | `ADMIN, HOST` |
| `/tournaments/new` | Tạo tournament mới | `HOST` |
| `/tournaments/[id]/manage` | Quản lý tournament | `ADMIN, HOST` |
| `/tournaments/[id]/manage/categories/[categoryId]` | Quản lý category trong tournament | `ADMIN, HOST` |
| `/tournaments/[id]/manage/pairs` | Quản lý pairs trong tournament | `ADMIN, HOST` |
| `/tournaments/[id]/manage/players` | Quản lý players trong tournament | `ADMIN, HOST` |
| `/my-session/[id]` | Xem session (cả HOST và PLAYER) | `PLAYER, HOST` |
| `/dashboard` | Dashboard (hiển thị HostDashboard) | `ADMIN, HOST` |

---

### 🔵 PLAYER Role

Pages dành cho PLAYER:

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/join/confirm` | Xác nhận tham gia session | `PLAYER` |
| `/my-session/[id]` | Xem session của player | `PLAYER, HOST` |
| `/dashboard` | Dashboard (hiển thị PlayerDashboard) | `PLAYER` |

---

### ⚪ GUEST Role

Pages dành cho GUEST (người dùng chưa đăng nhập hoặc tạm thời):

| Path | Mô tả | Required Roles |
|------|-------|----------------|
| `/my-session` | Trang session cho guest | `GUEST` |
| `/join/status` | Trạng thái tham gia | `GUEST` |

---

### 🟡 Public Pages (Không yêu cầu role cụ thể)

Pages có thể truy cập bởi bất kỳ ai (có thể yêu cầu đăng nhập nhưng không giới hạn role):

| Path | Mô tả | Auth Required |
|------|-------|---------------|
| `/` | Trang chủ | No |
| `/about` | Giới thiệu | No |
| `/auth/signin` | Đăng nhập | No |
| `/auth/signup` | Đăng ký | No |
| `/auth/callback` | OAuth callback | No |
| `/join` | Tham gia session | No |
| `/join/register` | Đăng ký tham gia | No |
| `/join-by-code` | Tham gia bằng code | No |
| `/sessions/find` | Tìm kiếm sessions | No |
| `/settings` | Cài đặt | Yes (any role) |
| `/player-status` | Trạng thái player | No |
| `/dashboard` | Dashboard (dynamic based on role) | Yes (any role) |
| `/tournaments` | Danh sách tournaments | No |
| `/tournaments/[id]` | Chi tiết tournament | No |
| `/tournaments/[id]/categories/[categoryId]` | Chi tiết category | No |
| `/tournaments/[id]/events` | Sự kiện tournament | No |
| `/tournaments/[id]/matches` | Danh sách matches | No |
| `/tournaments/[id]/players` | Danh sách players | No |
| `/tournaments/[id]/players/[playerId]` | Chi tiết player | No |
| `/tournaments/[id]/winners` | Người thắng cuộc | No |

---

## 📊 Tổng Hợp Theo Role

### ADMIN
- **Tổng số pages riêng**: 1 page (`/admin/users`)
- **Pages chia sẻ với HOST**: 8 pages (quản lý sessions và tournaments)
- **Quyền truy cập**: Có thể truy cập tất cả pages của HOST

### HOST
- **Tổng số pages riêng**: 1 page (`/tournaments/new`)
- **Pages chia sẻ với ADMIN**: 8 pages
- **Pages chia sẻ với PLAYER**: 1 page (`/my-session/[id]`)
- **Dashboard**: Hiển thị `HostDashboard` component

### PLAYER
- **Tổng số pages riêng**: 1 page (`/join/confirm`)
- **Pages chia sẻ với HOST**: 1 page (`/my-session/[id]`)
- **Dashboard**: Hiển thị `PlayerDashboard` component

### GUEST
- **Tổng số pages riêng**: 2 pages (`/my-session`, `/join/status`)
- **Đặc điểm**: Thường là người dùng tạm thời, chưa có tài khoản đầy đủ

---

## 🔐 Protected Route Guard

Ứng dụng sử dụng component `ProtectedRouteGuard` để bảo vệ các routes:

```tsx
<ProtectedRouteGuard requiredRole={[UserRole.HOST, UserRole.ADMIN]}>
  {/* Page content */}
</ProtectedRouteGuard>
```

### Cách hoạt động:
- Nếu không truyền `requiredRole`: Chỉ yêu cầu đăng nhập (bất kỳ role nào)
- Nếu truyền `requiredRole`: Kiểm tra user có role phù hợp không
- Nếu không có quyền: Redirect đến trang phù hợp

---

## 📝 Ghi Chú

1. **Dynamic Dashboard**: Trang `/dashboard` hiển thị nội dung khác nhau dựa trên role:
   - `HOST` hoặc `ADMIN`: Hiển thị `HostDashboard`
   - `PLAYER`: Hiển thị `PlayerDashboard`

2. **Tournament Pages**: Các trang tournament có 2 loại:
   - **Public view**: Xem thông tin tournament (không cần quyền đặc biệt)
   - **Management view**: Quản lý tournament (cần `HOST` hoặc `ADMIN`)

3. **Session Pages**: Tương tự tournament:
   - **Player view**: `/my-session/[id]` - Xem session từ góc độ player
   - **Host view**: `/host/sessions/[id]` - Quản lý session

4. **Multi-language Support**: Tất cả pages đều hỗ trợ đa ngôn ngữ thông qua `[locale]` route segment (vi/en)

---

## 🔄 Route Structure

```
/[locale]/
├── Public Pages
│   ├── / (home)
│   ├── /about
│   ├── /auth/* (signin, signup, callback)
│   ├── /join* (join, register, join-by-code)
│   ├── /sessions/find
│   ├── /player-status
│   └── /tournaments/* (public views)
│
├── ADMIN Only
│   └── /admin/users
│
├── HOST/ADMIN
│   ├── /host/sessions/*
│   └── /tournaments/*/manage/*
│
├── PLAYER
│   └── /join/confirm
│
├── GUEST
│   ├── /my-session
│   └── /join/status
│
└── Authenticated (any role)
    ├── /dashboard
    ├── /settings
    └── /my-session/[id]
```

---

**Ngày cập nhật**: 2026-01-16  
**Tổng số pages**: 35 pages  
**Tổng số protected pages**: 14 pages
