# Tóm tắt Implementation SEO Structured Data

## Đã hoàn thành

### 1. ✅ Component và Utilities

#### `src/components/seo/StructuredData.tsx`

Component để inject JSON-LD structured data vào trang.

**Cách dùng:**

```tsx
import StructuredData from '@/components/seo/StructuredData';

<StructuredData data={schemaObject} />
// hoặc nhiều schema
<StructuredData data={[schema1, schema2]} />
```

#### `src/lib/seo/structuredData.ts`

Các helper functions để generate schema:

- `generateWebsiteSchema(locale)` - Website schema với search box
- `generateOrganizationSchema()` - Organization schema
- `generateBreadcrumbSchema(items)` - Breadcrumb navigation
- `generateSportsEventSchema(session)` - Sports event cho kèo cầu lông
- `generateLocalBusinessSchema(venue)` - Local business cho sân cầu lông

### 2. ✅ Global Schema (Áp dụng cho toàn site)

**File:** `src/app/[locale]/layout.tsx`

Đã thêm:

- Website Schema với Sitelinks Search Box
- Organization Schema

Kết quả: Google có thể hiển thị search box trong kết quả tìm kiếm như hình bạn đã gửi.

### 3. ✅ Session Detail Schema

**File:** `src/app/[locale]/sessions/[id]/page.tsx`

Đã refactor để sử dụng:

- `generateSportsEventSchema()` function
- `StructuredData` component

Schema bao gồm:

- Tên và mô tả kèo
- Thời gian bắt đầu/kết thúc
- Địa điểm (tên, địa chỉ, tọa độ)
- Giá tiền
- Số người tham gia
- Thông tin host

### 4. ✅ Search Page

**Files:**

- `src/app/[locale]/search/page.tsx`
- `src/app/[locale]/search/SearchPageClient.tsx`

Tạo trang search cơ bản để URL trong schema hoạt động:

- `/vi/search?q=keyword`
- `/en/search?q=keyword`

Trang có 4 tabs:

- Kèo cầu lông
- Giải đấu
- Sân cầu lông
- Câu lạc bộ

**Lưu ý:** Hiện tại chỉ là UI, cần implement logic search thực tế.

### 5. ✅ Documentation

**File:** `docs/SEO_STRUCTURED_DATA.md`

Hướng dẫn chi tiết:

- Cách sử dụng structured data
- Examples cho từng loại trang
- Best practices
- Cách test và validate

## Các bước tiếp theo

### 1. Implement Search Functionality

Trang search hiện tại chỉ là placeholder. Cần:

- Kết nối với API search
- Hiển thị kết quả thực tế
- Pagination
- Filters

### 2. Thêm Schema cho các trang khác

#### Venue Detail Page

```tsx
// src/app/[locale]/venues/[id]/page.tsx
import StructuredData from '@/components/seo/StructuredData';
import { generateLocalBusinessSchema } from '@/lib/seo/structuredData';

const businessSchema = generateLocalBusinessSchema({
  id: venue.id,
  name: venue.name,
  description: venue.description,
  address: venue.address,
  latitude: venue.latitude,
  longitude: venue.longitude,
  phone: venue.phone,
  website: venue.website,
  openingHours: venue.openingHours,
  priceRange: venue.priceRange,
  rating: venue.rating,
  reviewCount: venue.reviewCount,
});

<StructuredData data={businessSchema} />;
```

#### Tournament Page

Tạo `generateTournamentSchema()` trong `structuredData.ts`:

```typescript
export function generateTournamentSchema(tournament: {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: string;
  };
  organizer?: {
    name: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    '@id': `${SITE_URL}/tournaments/${tournament.id}`,
    name: tournament.name,
    description: tournament.description,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
    sport: 'Badminton',
    // ... thêm các fields khác
  };
}
```

#### Club Page

Tạo `generateSportsOrganizationSchema()`:

```typescript
export function generateSportsOrganizationSchema(club: {
  id: string;
  name: string;
  description?: string;
  memberCount?: number;
  foundingDate?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name: club.name,
    description: club.description,
    sport: 'Badminton',
    // ... thêm các fields khác
  };
}
```

### 3. Thêm Breadcrumb Schema

Cho các trang có breadcrumb navigation:

```tsx
import { generateBreadcrumbSchema } from '@/lib/seo/structuredData';

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Trang chủ', url: 'https://vmito.com' },
  { name: 'Kèo cầu lông', url: 'https://vmito.com/sessions' },
  { name: session.name, url: `https://vmito.com/sessions/${session.id}` },
]);

<StructuredData data={breadcrumbSchema} />;
```

### 4. Google Search Console Setup

1. **Đăng ký website:**
   - Truy cập: https://search.google.com/search-console
   - Thêm property: `vmito.com`
   - Verify ownership (DNS hoặc HTML file)

2. **Submit Sitemap:**
   - URL: `https://vmito.com/sitemap.xml`
   - Kiểm tra file `src/app/sitemap.ts` đã có chưa

3. **Monitor Rich Results:**
   - Theo dõi tab "Enhancements"
   - Kiểm tra errors và warnings
   - Fix issues khi phát hiện

### 5. Testing và Validation

#### Trước khi deploy:

1. **Google Rich Results Test:**

   ```
   https://search.google.com/test/rich-results
   ```

   - Test từng loại trang (home, session, venue)
   - Đảm bảo không có errors

2. **Schema Markup Validator:**

   ```
   https://validator.schema.org/
   ```

   - Paste JSON-LD code
   - Validate syntax

3. **Local Testing:**
   ```bash
   cd vmito-fe
   pnpm build
   pnpm start
   ```

   - View page source
   - Tìm `<script type="application/ld+json">`
   - Copy JSON và validate

#### Sau khi deploy:

1. **Check Live URLs:**
   - Test production URLs với Rich Results Test
   - Đảm bảo schema được render đúng

2. **Monitor Search Console:**
   - Đợi 1-2 tuần để Google crawl
   - Kiểm tra rich results có xuất hiện không
   - Fix errors nếu có

### 6. Cải thiện thêm

#### A. Thêm FAQ Schema

Cho trang About hoặc Help:

```typescript
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "Vmito là gì?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Vmito là nền tảng..."
    }
  }]
}
```

#### B. Thêm Review Schema

Cho venues và sessions có reviews:

```typescript
{
  "@type": "Review",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "5",
    "bestRating": "5"
  },
  "author": {
    "@type": "Person",
    "name": "User Name"
  }
}
```

#### C. Thêm Video Schema

Nếu có video tutorials:

```typescript
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Hướng dẫn sử dụng Vmito",
  "description": "...",
  "thumbnailUrl": "...",
  "uploadDate": "...",
  "contentUrl": "..."
}
```

## Checklist Deploy

- [ ] Build project không có errors
- [ ] Test tất cả schema với Rich Results Test
- [ ] Verify sitemap.xml hoạt động
- [ ] Deploy lên production
- [ ] Submit sitemap trong Search Console
- [ ] Monitor trong 1-2 tuần
- [ ] Fix issues nếu có

## Kết quả mong đợi

Sau 2-4 tuần (thời gian Google crawl và index):

1. **Sitelinks Search Box** xuất hiện khi search "Vmito"
2. **Rich snippets** cho session pages (event info, price, date)
3. **Rich snippets** cho venue pages (rating, address, hours)
4. **Better CTR** từ search results
5. **Improved SEO ranking**

## Lưu ý quan trọng

⚠️ **Google không đảm bảo hiển thị rich snippets ngay lập tức**

Các yếu tố ảnh hưởng:

- Domain authority
- Content quality
- Traffic volume
- Schema accuracy
- Time (cần 2-4 tuần)

✅ **Điều quan trọng là implement đúng và đợi Google crawl**
