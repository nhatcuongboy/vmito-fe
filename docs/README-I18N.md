# Hệ thống Đa ngôn ngữ (i18n) - Badminton App

## Tổng quan

Ứng dụng Badminton đã được cài đặt hệ thống đa ngôn ngữ (internationalization - i18n) hỗ trợ:

- **Tiếng Anh (English)** - Ngôn ngữ mặc định (`en`)
- **Tiếng Việt (Vietnamese)** - (`vi`)

## Cấu trúc i18n

### 1. Cấu hình chính

- **`src/i18n/config.ts`**: Cấu hình routing và navigation cho i18n
- **`src/i18n/request.ts`**: Xử lý request và load messages
- **`middleware.ts`**: Middleware xử lý routing với locale

### 2. File messages

- **`src/i18n/messages/en.json`**: Bản dịch tiếng Anh
- **`src/i18n/messages/vi.json`**: Bản dịch tiếng Việt

### 3. Cấu trúc URL

```
/en              → Tiếng Anh (mặc định)
/vi              → Tiếng Việt
/en/host         → Trang host (tiếng Anh)
/vi/host         → Trang host (tiếng Việt)
/en/join         → Trang join (tiếng Anh)
/vi/join         → Trang join (tiếng Việt)
```

## Cách sử dụng

### 1. Sử dụng translations trong component

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('session');
  const common = useTranslations('common');

  return (
    <div>
      <h1>{t('createSession')}</h1>
      <button>{common('save')}</button>
    </div>
  );
}
```

### 2. Navigation với i18n

```tsx
import { Link } from '@/i18n/config';

export default function Navigation() {
  return (
    <nav>
      <Link href="/host">Host Session</Link>
      <Link href="/join">Join Session</Link>
    </nav>
  );
}
```

### 3. Language Switcher

Component `LanguageSwitcher` đã được tích hợp sẵn:

```tsx
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

## Cấu trúc Messages

### Categories chính:

1. **`navigation`**: Menu, điều hướng
2. **`common`**: Các từ thông dụng (save, cancel, delete, etc.)
3. **`session`**: Liên quan đến session/phiên chơi
4. **`court`**: Liên quan đến sân
5. **`player`**: Liên quan đến người chơi
6. **`match`**: Liên quan đến trận đấu
7. **`pages`**: Tiêu đề và mô tả các trang
8. **`errors`**: Thông báo lỗi

### Ví dụ sử dụng:

```tsx
// Session related
const t = useTranslations('session');
t('createSession'); // "Create Session" / "Tạo Phiên Chơi"
t('sessionName'); // "Session Name" / "Tên Phiên Chơi"
t('maxPlayersPerCourt'); // "Max Players Per Court" / "Tối Đa Người Chơi Mỗi Sân"

// Common words
const common = useTranslations('common');
common('save'); // "Save" / "Lưu"
common('cancel'); // "Cancel" / "Hủy"
common('loading'); // "Loading..." / "Đang tải..."

// Validation messages
t('validation.sessionNameRequired'); // "Session name is required" / "Tên phiên chơi là bắt buộc"
```

## Thêm ngôn ngữ mới

### Bước 1: Thêm locale vào config

```typescript
// src/i18n/config.ts
export const routing = defineRouting({
  locales: ['en', 'vi', 'fr'], // Thêm 'fr' cho tiếng Pháp
  defaultLocale: 'en',
  localePrefix: 'always',
});
```

### Bước 2: Tạo file messages mới

Tạo file `src/i18n/messages/fr.json` với cấu trúc tương tự file tiếng Anh.

### Bước 3: Cập nhật LanguageSwitcher

```typescript
// src/components/ui/LanguageSwitcher.tsx
const locales = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' }, // Thêm tiếng Pháp
];
```

## Thêm bản dịch mới

### 1. Thêm vào file messages

```json
// src/i18n/messages/en.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}

// src/i18n/messages/vi.json
{
  "newFeature": {
    "title": "Tính Năng Mới",
    "description": "Đây là tính năng mới"
  }
}
```

### 2. Sử dụng trong component

```tsx
const t = useTranslations('newFeature');
return <h1>{t('title')}</h1>;
```

## Best Practices

### 1. Tổ chức messages

- Nhóm theo chức năng (session, court, player)
- Sử dụng nested structure cho các messages liên quan
- Validation messages nên được nhóm riêng

### 2. Naming conventions

- Sử dụng camelCase cho keys
- Đặt tên mô tả rõ ràng
- Tránh viết tắt không rõ nghĩa

### 3. Fallback handling

- Luôn có bản dịch tiếng Anh đầy đủ
- Kiểm tra missing translations thường xuyên
- Sử dụng TypeScript để type safety

## Troubleshooting

### 1. Lỗi "useTranslations must be used within NextIntlClientProvider"

Đảm bảo component được wrap trong `NextIntlClientProvider` ở layout.

### 2. Missing translation keys

Kiểm tra file messages có đúng cấu trúc và tồn tại key không.

### 3. Routing issues

Đảm bảo middleware được cấu hình đúng và exclude API routes.

## Testing i18n

### 1. Test UI với các ngôn ngữ

- Truy cập `/en` và `/vi` để kiểm tra
- Test Language Switcher
- Kiểm tra navigation links

### 2. Test responsive text

- Tiếng Việt thường dài hơn tiếng Anh
- Đảm bảo UI không bị vỡ với text dài

### 3. Test fallback

- Xóa tạm một key để test fallback behavior
- Kiểm tra error handling

## URLs để test

- Trang chủ tiếng Anh: http://localhost:3000/en
- Trang chủ tiếng Việt: http://localhost:3000/vi
- Tạo session tiếng Anh: http://localhost:3000/en/host/new
- Tạo session tiếng Việt: http://localhost:3000/vi/host/new
- Join session tiếng Anh: http://localhost:3000/en/join
- Join session tiếng Việt: http://localhost:3000/vi/join
