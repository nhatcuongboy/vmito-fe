# UI/UX Redesign Concept — Badminton Booking (Tìm Kèo)

## 1) Bối cảnh

### 1.1 Vấn đề hiện tại
- Giao diện quá tối giản, thiên về text, thiếu yếu tố hình ảnh → cảm giác giống trang quản trị.
- Phân cấp thị giác (visual hierarchy) yếu: thông tin quan trọng không “nhảy” lên.
- Bottom navigation hiển thị trên Desktop gây khó dùng, không đúng kỳ vọng hành vi.

### 1.2 Mục tiêu redesign
- Tăng độ hấp dẫn, cảm giác “cộng đồng sôi động” nhưng vẫn rõ ràng, dễ quét (scan).
- Giữ màu xanh thương hiệu là màu chủ đạo cho hành động chính (primary actions).
- Tối ưu trải nghiệm theo thiết bị (responsive patterns đúng chuẩn).

### 1.3 Nguyên tắc thiết kế
- **Content-first**: ưu tiên hiển thị nhanh các tiêu chí ra quyết định (địa điểm, thời gian, giá, số chỗ).
- **Scanability**: dùng icon + nhóm thông tin + spacing để người dùng đọc lướt.
- **Trust & Social proof**: avatar, rating, số lượt đánh giá.
- **Progressive disclosure**: chi tiết sâu đặt trong modal/drawer hoặc trang chi tiết.

---

## 2) IA (Information Architecture) & User Flow

### 2.1 Luồng chính (Discovery → Join)
1. Mở trang **Tìm kèo**
2. Nhập tìm kiếm / dùng bộ lọc
3. Xem danh sách kèo (cards)
4. Chọn một kèo → xem chi tiết
5. Join/Contact/Share

### 2.2 Luồng phụ (Host)
1. Xem danh sách kèo
2. Vào chi tiết kèo
3. Quản lý người tham gia / kết thúc kèo / liên hệ

---

## 3) Layout Concept theo Breakpoints

### 3.1 Desktop (>= 1024px)
**Mục tiêu**: trải nghiệm “web app” chuẩn desktop, tối ưu thao tác chuột, tận dụng không gian ngang.

**Cấu trúc đề xuất (3 cột)**
- **Cột trái**: Filter Sidebar (sticky)
- **Giữa**: Results (cards)
- **Cột phải**: Community/Activity panel (tùy chọn)

**Wireframe mô tả**
- Header top navigation (cố định)
- Hero section (ảnh + search)
- Body: Filters / Results / Activity

### 3.2 Tablet (768px–1023px)
- Header top navigation giữ lại.
- Filters chuyển sang **Drawer** (nút “Bộ lọc”).
- Results hiển thị 2 cột cards (tùy độ rộng).

### 3.3 Mobile (< 768px)
- Hero section gọn.
- Filters dùng **Bottom Sheet**.
- Results 1 cột.
- **Bottom navigation chỉ dùng cho mobile**.

---

## 4) Navigation — Fix bottom navigation on Desktop

### 4.1 Vấn đề
Bottom navigation là pattern tối ưu cho thumb zone trên mobile, nhưng:
- Trên desktop gây “lệch kỳ vọng” (user mong top nav/side nav).
- Mouse travel xuống đáy màn hình tăng friction.

### 4.2 Giải pháp
**Responsive navigation pattern**
- **Mobile**: Bottom navigation (5 items) + nhấn mạnh tab hiện tại.
- **Tablet/Desktop**: Top navigation bar.

### 4.3 Spec đề xuất
- Desktop: Top bar gồm logo + tabs + search/action + notification + avatar.
- Tablet: Top bar rút gọn + hamburger.
- Mobile: Bottom nav, top bar tối giản.

**Acceptance criteria**
- Desktop không hiển thị bottom nav.
- Mobile luôn hiển thị bottom nav.
- Tablet tùy thiết kế, ưu tiên top nav + drawer.

---

## 5) Visual System (Brand-safe, giàu hình ảnh)

### 5.1 Color roles (khuyến nghị)
- **Brand Primary**: Blue-600 (CTA, link chính, active states)
- **Brand Secondary**: Blue-50/100 (background nhạt, surfaces)
- **Neutral**: Slate/Gray cho text và viền
- **Semantic**:
  - Success (slots còn nhiều)
  - Warning (sắp đầy)
  - Danger (hết chỗ)

**Nguyên tắc**
- Màu xanh dùng cho **hành động chính** và **trạng thái active**.
- Nội dung thông tin dùng neutral để tránh “loạn” màu.

### 5.2 Typography scale (khuyến nghị)
- Page title/Hero: 24–28 / semibold
- Card title (tên sân/kèo): 18–20 / semibold
- Section label: 14–16 / medium
- Body: 14 / regular
- Caption/meta: 12 / regular

### 5.3 Spacing & radius
- Card padding: 16–20
- Gaps:
  - 8: trong nhóm cùng loại
  - 12: giữa nhóm thông tin
  - 24–32: giữa các khối lớn
- Radius:
  - Card: 12–16
  - Pills/chips: 999

### 5.4 Elevation
- Default card: shadow nhẹ
- Hover card: tăng shadow + lift 2–4px
- Sticky elements: shadow viền dưới

---

## 6) Visual Elements — Tăng “đời sống cộng đồng”

### 6.1 Hero Section (Desktop/Tablet)
- **Background image**: ảnh sân cầu lông hoặc cảnh chơi (ưu tiên bản quyền/stock)
- **Overlay gradient**: xanh thương hiệu + blur nhẹ để giữ readability
- **Search bar dạng nổi (glass/soft)**

**Lý do**
- Tạo cảm xúc và định vị “community sports” ngay từ first impression.
- Giữ brand bằng overlay và CTA.

### 6.2 Avatar & Social proof
- Hiển thị avatar host (hoặc initials) + badge verified (nếu có).
- Rating trung bình + số lượt đánh giá.

### 6.3 Court imagery trong cards
- Thêm cover image cho sân (nếu có), fallback bằng gradient + icon.

### 6.4 Empty/Loading states có illustration
- Empty state: minh họa shuttlecock + CTA “Tạo kèo / Nới bộ lọc”.
- Loading: skeleton cards.

---

## 7) Cards Redesign — Visual hierarchy rõ ràng

### 7.1 Mục tiêu card
- Người dùng quét nhanh 3 câu hỏi:
  - Ở đâu?
  - Khi nào?
  - Chi phí & còn chỗ không?

### 7.2 Card anatomy (đề xuất)
**Header**
- Cover image (16:9) + chip trạng thái (Còn chỗ / Sắp đầy / Hết chỗ)

**Main**
- Tên sân/kèo (title)
- Location (district/city) — icon
- Time/date — icon

**Highlights row**
- Price range
- Slots (x/y)
- Level pills

**Footer actions**
- Primary: Join/Host/Chi tiết (tùy role)
- Secondary: Share / Call / Message

### 7.3 Hierarchy rules
- Title lớn nhất.
- Time và location đứng ngay sau title.
- Price/slots là “highlights” có màu semantic nhẹ.
- Meta text (host name, note) nhỏ hơn.

### 7.4 Hover & focus states
- Hover: lift + shadow + làm nổi CTA.
- Keyboard focus: outline rõ ràng theo brand.

---

## 8) Filters Redesign — Từ “form” sang “control panel”

### 8.1 Desktop: Sidebar sticky
- Filters luôn nhìn thấy, không cần mở modal.
- Thay vì một khung form lớn, chia theo section:
  - Khu vực
  - Ngày
  - Trạng thái chỗ
  - Khoảng giá
  - Trình độ
  - Khung giờ

### 8.2 Chips & quick presets
- City/district: chips multi-select.
- Price: slider + presets ("<80k", "80–120k", ">120k").
- Time: pills (Sáng/Chiều/Tối/Đêm).

### 8.3 Apply behavior
- Desktop: ưu tiên **auto-apply** (debounce 300–500ms) hoặc “Apply” sticky.
- Mobile: “Apply” rõ ràng trong bottom sheet.

### 8.4 Clear filters
- Nút “Xóa lọc” nên:
  - Có vị trí nhất quán (top/right trong filter panel)
  - Có confirm nếu xóa nhiều selection

---

## 9) Community Layer (tùy chọn) — Làm trang bớt “dashboard”

### 9.1 Activity panel (Desktop)
- “Hoạt động gần đây”: ai vừa tham gia/tạo kèo.
- “Sân phổ biến”: carousel mini.

### 9.2 Trust signals
- Badge “Host uy tín” cho rating >= 4.5 và đủ số lượng reviews.

---

## 10) Micro-interactions & Motion

### 10.1 Nguyên tắc
- Motion phục vụ feedback, không gây nhiễu.
- Thời lượng 150–250ms cho hover, 250–350ms cho panel.

### 10.2 Danh sách interactions
- Card hover lift.
- Filter drawer slide.
- Skeleton loading cho list.
- Toast khi join thành công.

---

## 11) Accessibility (A11y)
- Contrast đủ cho text trên overlay ảnh.
- Tab order rõ ràng.
- ARIA labels cho icon buttons.
- Stars/rating (nếu có) phải đọc được bằng screen reader.

---

## 12) Checklist triển khai (Frontend)

### 12.1 High impact / low effort
- Desktop: ẩn bottom nav, chuyển sang top nav.
- Điều chỉnh typography hierarchy trong cards.
- Thêm icons + spacing nhóm thông tin.

### 12.2 Medium effort
- Hero section (ảnh + overlay + search bar).
- Card cover image + fallback.
- Filters sidebar (desktop) + drawer (tablet/mobile).

### 12.3 Polish
- Activity panel.
- Motion & empty states.

---

## 13) Acceptance Criteria (Nghiệm thu)

### 13.1 Visual
- Cards có ảnh (hoặc fallback) và có điểm nhấn rõ ràng.
- CTA dùng brand blue nhất quán.
- Empty state không còn “trống trơn”.

### 13.2 UX
- Desktop không còn bottom nav.
- Filter sử dụng thuận tiện (desktop sidebar, mobile bottom sheet).
- Người dùng có thể quét list và ra quyết định trong 3–5 giây cho mỗi card.

### 13.3 Performance
- Ảnh dùng size phù hợp (responsive images).
- Skeleton loading thay spinner dài.

---

## 14) Asset Guidelines
- Ảnh sân: ưu tiên 1200px chiều ngang, crop 16:9.
- Avatar: 64–128px.
- Illustrations: SVG nhẹ.

---

## 15) Gợi ý tiếp theo
Nếu bạn muốn, mình có thể:
- Viết spec chi tiết cho từng component (props/states)
- Đề xuất token hóa design system (colors/spacing/type) để implement bằng Tailwind/CSS variables
- Lập backlog UI theo từng sprint
