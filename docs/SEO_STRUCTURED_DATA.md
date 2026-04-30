# SEO Structured Data Guide

## Tổng quan

Structured data (dữ liệu có cấu trúc) giúp công cụ tìm kiếm hiểu nội dung trang web tốt hơn và hiển thị rich snippets (đoạn trích phong phú) trong kết quả tìm kiếm.

## Đã implement

### 1. Website Schema với Sitelinks Search Box

**Vị trí:** `src/app/[locale]/layout.tsx`

Schema này cho phép Google hiển thị ô tìm kiếm trực tiếp trong kết quả tìm kiếm của website.

```typescript
import StructuredData from '@/components/seo/StructuredData';
import { generateWebsiteSchema, generateOrganizationSchema } from '@/lib/seo/structuredData';

const websiteSchema = generateWebsiteSchema(locale);
const organizationSchema = generateOrganizationSchema();

<StructuredData data={[websiteSchema, organizationSchema]} />
```

### 2. Organization Schema

Cung cấp thông tin về Vmito như một tổ chức.

## Cách sử dụng cho các trang khác

### Session Detail Page

Thêm vào `src/app/[locale]/sessions/[id]/page.tsx`:

```typescript
import StructuredData from '@/components/seo/StructuredData';
import { generateSportsEventSchema } from '@/lib/seo/structuredData';

export default async function SessionDetailPage({ params }) {
  const session = await fetchSession(params.id);

  const eventSchema = generateSportsEventSchema({
    id: session.id,
    title: session.title,
    description: session.description,
    startTime: session.startTime,
    endTime: session.endTime,
    location: {
      name: session.venue?.name,
      address: session.venue?.address,
      latitude: session.venue?.latitude,
      longitude: session.venue?.longitude,
    },
    maxPlayers: session.maxPlayers,
    currentPlayers: session.currentPlayers,
    price: session.price,
    organizer: {
      name: session.host?.name,
      image: session.host?.avatar,
    },
  });

  return (
    <>
      <StructuredData data={eventSchema} />
      {/* Page content */}
    </>
  );
}
```

### Venue Detail Page

Thêm vào `src/app/[locale]/venues/[id]/page.tsx`:

```typescript
import StructuredData from '@/components/seo/StructuredData';
import { generateLocalBusinessSchema } from '@/lib/seo/structuredData';

export default async function VenueDetailPage({ params }) {
  const venue = await fetchVenue(params.id);

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

  return (
    <>
      <StructuredData data={businessSchema} />
      {/* Page content */}
    </>
  );
}
```

### Breadcrumb Schema

Thêm vào bất kỳ trang nào có breadcrumb:

```typescript
import StructuredData from '@/components/seo/StructuredData';
import { generateBreadcrumbSchema } from '@/lib/seo/structuredData';

const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Trang chủ', url: 'https://vmito.com' },
  { name: 'Kèo cầu lông', url: 'https://vmito.com/sessions' },
  { name: 'Chi tiết kèo', url: `https://vmito.com/sessions/${id}` },
]);

<StructuredData data={breadcrumbSchema} />
```

## Kiểm tra và validate

### 1. Google Rich Results Test

- URL: https://search.google.com/test/rich-results
- Nhập URL trang web hoặc paste HTML code
- Kiểm tra xem schema có hợp lệ không

### 2. Schema Markup Validator

- URL: https://validator.schema.org/
- Paste JSON-LD code để validate

### 3. Google Search Console

- Đăng ký website tại: https://search.google.com/search-console
- Theo dõi rich results và errors
- Submit sitemap

## Các loại Schema có sẵn

1. **WebSite Schema** - Trang chủ, có search box
2. **Organization Schema** - Thông tin tổ chức
3. **SportsEvent Schema** - Chi tiết kèo cầu lông
4. **LocalBusiness Schema** - Chi tiết sân cầu lông
5. **BreadcrumbList Schema** - Breadcrumb navigation

## Best Practices

1. **Chỉ thêm schema phù hợp với nội dung trang**
   - Không thêm SportsEvent schema vào trang không phải event
2. **Đảm bảo dữ liệu chính xác**
   - Schema phải match với nội dung hiển thị trên trang
3. **Sử dụng URL đầy đủ**
   - Luôn dùng absolute URL (https://vmito.com/...)
4. **Test trước khi deploy**
   - Dùng Rich Results Test để validate
5. **Monitor trong Search Console**
   - Theo dõi errors và warnings
   - Fix issues khi phát hiện

## Tài liệu tham khảo

- [Schema.org Documentation](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Specification](https://json-ld.org/)

## Lưu ý quan trọng

- Google không đảm bảo sẽ hiển thị rich snippets ngay lập tức
- Cần thời gian để Google crawl và index
- Website cần có uy tín và traffic nhất định
- Nội dung phải chất lượng và relevant
