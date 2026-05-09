# Tournament Settings Panels Implementation

## Overview

Đã triển khai 3 trang chỉnh sửa trong Settings cho tournament: Name, Dates, và Location.

## Files Created

### 1. NamePanel Component

**Path:** `src/components/tournament/manage/panels/NamePanel.tsx`

**Features:**

- Form đơn giản để edit tên tournament
- Validation: tên không được để trống
- Hiển thị thông báo khi không có thay đổi
- Auto-save với loading state
- Callback `onTournamentUpdate` để refresh parent component

**Props:**

- `tournament: Tournament` - Tournament object hiện tại
- `onTournamentUpdate?: (updated: Tournament) => void` - Callback khi update thành công

### 2. DatesPanel Component

**Path:** `src/components/tournament/manage/panels/DatesPanel.tsx`

**Features:**

- Form với 2 date inputs: Start Date và End Date
- Validation:
  - Cả 2 dates đều required
  - End date phải sau start date
- Preview ngày tháng với format dễ đọc
- Date range preview với icon
- Auto-save với loading state

**Props:**

- `tournament: Tournament` - Tournament object hiện tại
- `onTournamentUpdate?: (updated: Tournament) => void` - Callback khi update thành công

### 3. LocationPanel Component

**Path:** `src/components/tournament/manage/panels/LocationPanel.tsx`

**Features:**

- Search venues với keyword
- Hiển thị danh sách venues với:
  - Tên venue
  - Địa chỉ
  - City/location
  - Selection indicator
- Map preview cho venue được chọn (sử dụng VenueMapPin component)
- Clear selection button
- Auto-save với loading state

**Props:**

- `tournament: Tournament` - Tournament object hiện tại
- `onTournamentUpdate?: (updated: Tournament) => void` - Callback khi update thành công

## Files Modified

### 1. TournamentManage Component

**Path:** `src/components/tournament/manage/TournamentManage.tsx`

**Changes:**

- Import 3 panels mới: NamePanel, DatesPanel, LocationPanel
- Thêm 3 cases mới trong `renderPanel()` function:
  - `case 'name'`: render NamePanel
  - `case 'dates'`: render DatesPanel
  - `case 'location'`: render LocationPanel

### 2. Translation Files

#### English (en.json)

**Path:** `src/i18n/messages/en.json`

**Added:**

- `pages.tournaments.detail.manage.panelTitles.name`
- `pages.tournaments.detail.manage.panelTitles.dates`
- `pages.tournaments.detail.manage.panelTitles.location`
- `pages.tournaments.detail.manage.panels.name.*` - Tất cả translations cho NamePanel
- `pages.tournaments.detail.manage.panels.dates.*` - Tất cả translations cho DatesPanel
- `pages.tournaments.detail.manage.panels.location.*` - Tất cả translations cho LocationPanel

#### Vietnamese (vi.json)

**Path:** `src/i18n/messages/vi.json`

**Added:**

- Tương tự như en.json nhưng với Vietnamese translations

#### Chinese (cn.json)

**Path:** `src/i18n/messages/cn.json`

**Added:**

- Tương tự như en.json nhưng với Chinese translations

## API Integration

### TournamentService

Sử dụng method có sẵn:

```typescript
TournamentService.updateTournament(id: string, data: Partial<Tournament>)
```

**Update fields:**

- `name: string` - Cho NamePanel
- `startDate: Date` - Cho DatesPanel
- `endDate: Date` - Cho DatesPanel
- `venueId: string | null` - Cho LocationPanel

### VenueService

Sử dụng methods:

```typescript
VenueService.searchVenues(filters?: { keyword?: string, ... })
```

## User Flow

### Name Panel

1. User click vào "Name" trong Settings menu
2. Panel hiển thị form với input field chứa tên hiện tại
3. User edit tên
4. Click "Save" button
5. API call để update tournament
6. Success toast hiển thị
7. Parent component refresh để hiển thị tên mới

### Dates Panel

1. User click vào "Dates" trong Settings menu
2. Panel hiển thị 2 date inputs với dates hiện tại
3. User chọn dates mới
4. Preview hiển thị date range
5. Click "Save" button
6. Validation check (end > start)
7. API call để update tournament
8. Success toast hiển thị
9. Parent component refresh

### Location Panel

1. User click vào "Location" trong Settings menu
2. Panel hiển thị search bar và danh sách venues
3. User có thể:
   - Search venues bằng keyword
   - Click vào venue để select
   - Xem map preview của venue được chọn
   - Clear selection nếu muốn remove venue
4. Click "Save" button
5. API call để update tournament
6. Success toast hiển thị
7. Parent component refresh

## Responsive Design

Tất cả 3 panels đều responsive:

- **Desktop**: Hiển thị trong right panel (sticky position)
- **Mobile**: Hiển thị trong VDrawer (slide from bottom)

## Error Handling

Mỗi panel có error handling cho:

- Validation errors (hiển thị error toast)
- API errors (hiển thị error toast)
- Loading states (disable buttons, show loading spinner)

## Testing Checklist

- [ ] NamePanel: Edit và save tên mới
- [ ] NamePanel: Validation khi tên trống
- [ ] NamePanel: No changes detection
- [ ] DatesPanel: Edit và save dates mới
- [ ] DatesPanel: Validation end date > start date
- [ ] DatesPanel: Date preview hiển thị đúng
- [ ] LocationPanel: Search venues
- [ ] LocationPanel: Select venue
- [ ] LocationPanel: Map preview hiển thị
- [ ] LocationPanel: Clear selection
- [ ] All panels: Loading states
- [ ] All panels: Error handling
- [ ] All panels: Responsive trên mobile
- [ ] All panels: Translations (en, vi, cn)

## Next Steps

Có thể mở rộng thêm:

1. Add image upload cho banner trong settings
2. Add visibility settings (public/private)
3. Add custom slug/URL settings
4. Add admin management panel
5. Add sponsors management panel
