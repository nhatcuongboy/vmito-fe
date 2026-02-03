# Bulk Session Creation - Implementation Summary

## Overview

Tính năng tạo nhiều session cùng lúc đã được triển khai hoàn chỉnh cho frontend. Host có thể tạo một session và clone nó sang nhiều ngày khác hoặc tạo theo lịch định kỳ (recurring).

## Các chế độ tạo session

### 1. Single Mode (Chỉ tạo một kèo)

- Tạo một session duy nhất với thông tin đã nhập
- Chế độ mặc định, tương thích với flow hiện tại

### 2. Specific Dates Mode (Clone sang các ngày cụ thể)

- Chọn các ngày cụ thể từ calendar
- Mỗi ngày được chọn sẽ tạo một session mới với:
  - Cùng thông tin (tên, địa điểm, host, settings, etc.)
  - Giữ nguyên giờ bắt đầu/kết thúc từ session gốc
  - Chỉ thay đổi ngày
- Ví dụ: Session gốc 05/02 18:00-20:00 → Clone sang 10/02, 15/02, 20/02 đều là 18:00-20:00

### 3. Recurring Weekdays Mode (Lịch định kỳ theo ngày trong tuần)

- Chọn các ngày trong tuần (Thứ 2, 4, 6, v.v.)
- Nhập số tuần muốn lặp lại (1-52 tuần)
- Hệ thống tự động tạo session cho tất cả các ngày đã chọn trong khoảng thời gian đó
- Ví dụ: Chọn Thứ 2, 4, 6 và 4 tuần → Tạo 12 sessions (3 ngày/tuần × 4 tuần)

## Files đã thay đổi/tạo mới

### 1. Types & Interfaces

**File:** [src/lib/api/types.ts](src/lib/api/types.ts)

```typescript
// Các types mới được thêm:
export type BulkCreationMode =
  | 'single'
  | 'specific-dates'
  | 'recurring-weekdays';

export interface SpecificDatesConfig {
  dates: Date[];
}

export interface RecurringWeekdaysConfig {
  weekdays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  numberOfWeeks: number;
  startDate?: Date;
}

export interface BulkSessionCreationRequest {
  mode: BulkCreationMode;
  baseSession: CreateSessionRequest;
  specificDates?: SpecificDatesConfig;
  recurringWeekdays?: RecurringWeekdaysConfig;
}

export interface BulkSessionCreationResponse {
  success: boolean;
  sessionsCreated: number;
  sessions: ISession[];
  errors?: Array<{ date: string; error: string }>;
}
```

### 2. API Service

**File:** [src/lib/api/session.service.ts](src/lib/api/session.service.ts)

```typescript
// Method mới được thêm:
createBulkSessions: async (
  data: BulkSessionCreationRequest
): Promise<BulkSessionCreationResponse> => {
  const response = await api.post<ApiResponse<BulkSessionCreationResponse>>(
    '/sessions/bulk',
    data
  );
  return response.data.data!;
};
```

### 3. UI Component

**File:** [src/components/session/BulkSessionDateSelector.tsx](src/components/session/BulkSessionDateSelector.tsx) _(MỚI)_

Component chính cho việc chọn mode và cấu hình bulk creation:

- Radio group để chọn mode (single/specific-dates/recurring-weekdays)
- Calendar component để chọn các ngày cụ thể
- Checkboxes để chọn các ngày trong tuần
- Input để nhập số tuần
- Hiển thị preview số sessions sẽ được tạo
- Tích hợp đầy đủ với i18n (next-intl)

**Props:**

```typescript
interface BulkSessionDateSelectorProps {
  baseStartTime?: Date;
  onModeChange: (mode: BulkCreationMode) => void;
  onSpecificDatesChange: (config: SpecificDatesConfig | undefined) => void;
  onRecurringWeekdaysChange: (
    config: RecurringWeekdaysConfig | undefined
  ) => void;
}
```

### 4. Session Form

**File:** [src/components/session/SessionForm.tsx](src/components/session/SessionForm.tsx)

**Thay đổi:**

- Import BulkSessionDateSelector và các types
- Thêm 3 state mới:
  ```typescript
  const [bulkMode, setBulkMode] = useState<BulkCreationMode>('single');
  const [specificDatesConfig, setSpecificDatesConfig] =
    useState<SpecificDatesConfig>();
  const [recurringWeekdaysConfig, setRecurringWeekdaysConfig] =
    useState<RecurringWeekdaysConfig>();
  ```
- Update hàm `onSubmit` để xử lý bulk creation:
  - Nếu mode = 'single': gọi `SessionService.createSession()` như cũ
  - Nếu mode khác: gọi `SessionService.createBulkSessions()` với config
  - Hiển thị thông báo thành công với số sessions đã tạo
- Thêm component BulkSessionDateSelector vào UI (chỉ hiện ở create mode, không hiện ở edit mode)

**Vị trí trong form:** Ngay trước phần "Fee Configuration"

### 5. Translations

**File:** [src/i18n/messages/vi.json](src/i18n/messages/vi.json)

**Các translations đã thêm:**

```json
{
  "session": {
    "validation": {
      "bulkCreationFailed": "Không thể tạo nhiều kèo"
    },
    "bulkCreation": {
      "title": "Tạo nhiều kèo",
      "description": "Chọn cách tạo kèo: tạo một lần, clone sang nhiều ngày cụ thể, hoặc tạo theo lịch định kỳ",
      "singleMode": "Chỉ tạo một kèo",
      "singleModeDesc": "Tạo kèo với thông tin đã nhập",
      "specificDatesMode": "Clone sang các ngày cụ thể",
      "specificDatesDesc": "Chọn các ngày từ lịch để tạo kèo với cùng thông tin",
      "recurringMode": "Lịch định kỳ theo ngày trong tuần",
      "recurringModeDesc": "Chọn các ngày trong tuần và số tuần để tạo kèo tự động",
      "selectWeekdays": "Chọn các ngày trong tuần:",
      "numberOfWeeks": "Số tuần:",
      "weeksUnit": "tuần (tối đa 52)",
      "selectedDates": "Các ngày đã chọn ({count}):",
      "selectedWeekdays": "Các ngày đã chọn:",
      "totalSessions": "Tổng số kèo sẽ tạo:",
      "totalSessionsCalc": "{perWeek} ngày/tuần × {weeks} tuần = {total} kèo",
      "weekdays": {
        "monday": "Thứ 2",
        "tuesday": "Thứ 3",
        "wednesday": "Thứ 4",
        "thursday": "Thứ 5",
        "friday": "Thứ 6",
        "saturday": "Thứ 7",
        "sunday": "Chủ nhật",
        "mon": "T2",
        "tue": "T3",
        "wed": "T4",
        "thu": "T5",
        "fri": "T6",
        "sat": "T7",
        "sun": "CN"
      }
    },
    "bulkCreationSuccess": "Tạo nhiều kèo thành công",
    "sessionsCreated": "kèo đã được tạo"
  }
}
```

## Backend Requirements

### API Endpoint cần implement

**POST `/api/sessions/bulk`**

Chi tiết đầy đủ xem tại: [BULK_SESSION_API.md](BULK_SESSION_API.md)

**Request Body:**

```typescript
{
  mode: 'single' | 'specific-dates' | 'recurring-weekdays';
  baseSession: CreateSessionRequest;
  specificDates?: { dates: Date[] };
  recurringWeekdays?: {
    weekdays: number[];
    numberOfWeeks: number;
    startDate?: Date;
  };
}
```

**Response:**

```typescript
{
  success: boolean;
  sessionsCreated: number;
  sessions: ISession[];
  errors?: Array<{ date: string; error: string }>;
}
```

**Logic quan trọng:**

1. **All-or-nothing**: Dùng transaction, nếu một session fails thì rollback tất cả
2. **Preserve time**: Khi clone sang ngày khác, giữ nguyên giờ (startTime/endTime hours:minutes)
3. **Avoid duplicates**: Trong recurring mode, không tạo duplicate nếu ngày tính toán trùng với base session

## Testing

### Manual Testing Checklist

#### Single Mode

- [ ] Tạo session với mode "Chỉ tạo một kèo"
- [ ] Verify chỉ có 1 session được tạo
- [ ] Verify thông tin session chính xác

#### Specific Dates Mode

- [ ] Chọn mode "Clone sang các ngày cụ thể"
- [ ] Chọn 3 ngày từ calendar
- [ ] Verify hiển thị đúng "Tổng số kèo sẽ tạo: 4" (base + 3 cloned)
- [ ] Submit và verify 4 sessions được tạo
- [ ] Verify mỗi session có đúng ngày nhưng cùng giờ

#### Recurring Weekdays Mode

- [ ] Chọn mode "Lịch định kỳ theo ngày trong tuần"
- [ ] Chọn Thứ 2, 4, 6 (3 ngày)
- [ ] Nhập số tuần = 4
- [ ] Verify hiển thị "3 ngày/tuần × 4 tuần = 12 kèo"
- [ ] Submit và verify 12 sessions được tạo (hoặc 13 nếu tính base)
- [ ] Verify các sessions được tạo đúng ngày trong tuần

#### Edge Cases

- [ ] Chọn ngày trong quá khứ (should be disabled)
- [ ] Chọn 0 ngày trong specific dates mode (should disable submit or show warning)
- [ ] Chọn 0 weekdays trong recurring mode (should disable submit)
- [ ] Nhập số tuần > 52 (should cap at 52)
- [ ] Backend error handling (simulate backend error, verify rollback)

#### Internationalization

- [ ] Verify tất cả text hiển thị tiếng Việt
- [ ] Switch sang tiếng Anh (nếu có) và verify translations

## User Flow

1. Host truy cập trang tạo session mới
2. Điền thông tin session như bình thường (tên, địa điểm, giờ, host info, courts, etc.)
3. Cuộn xuống phần "Tạo nhiều kèo" (ngay trước Fee Configuration)
4. Chọn một trong 3 modes:
   - **Single**: Không làm gì thêm
   - **Specific Dates**: Chọn các ngày từ calendar
   - **Recurring**: Chọn weekdays và số tuần
5. Xem preview số sessions sẽ được tạo
6. Click "Tạo kèo"
7. Backend tạo tất cả sessions
8. Hiển thị toast thông báo "X kèo đã được tạo"
9. Navigate đến session đầu tiên được tạo

## Architecture Decisions

### Why All-or-Nothing?

- Đảm bảo data consistency
- Tránh trường hợp một số sessions thành công, một số thất bại
- Dễ rollback và retry

### Why Preserve Time?

- UX tốt hơn: Host không cần nhập giờ lại cho mỗi ngày
- Use case phổ biến: Sessions thường diễn ra cùng giờ

### Why Separate Component?

- Separation of concerns
- Dễ test và maintain
- Có thể reuse component này ở các nơi khác nếu cần

## Performance Considerations

- **Frontend**: Không có vấn đề performance đáng kể
- **Backend**:
  - Cần optimize cho bulk creation với số lượng lớn (>50 sessions)
  - Có thể cần implement background job cho bulk creation lớn
  - Cân nhắc rate limiting

## Security Considerations

- Authentication: Dùng authentication hiện tại
- Authorization: Host chỉ có thể tạo sessions cho chính họ
- Rate limiting: Giới hạn số sessions có thể tạo trong một request (recommend: max 100)
- Validation: Validate tất cả input ở cả frontend và backend

## Future Enhancements

1. **Templates**: Lưu bulk creation config thành template để reuse
2. **Preview Mode**: Hiển thị list các sessions sẽ được tạo trước khi submit
3. **Partial Success Mode**: Option để cho phép tạo một số sessions thành công thay vì all-or-nothing
4. **Batch Edit/Delete**: Cho phép edit hoặc delete nhiều sessions cùng lúc
5. **Calendar View**: Hiển thị các sessions được tạo trên calendar view
6. **Export**: Export danh sách sessions sang Excel/CSV

## Known Limitations

1. Backend endpoint chưa được implement - cần thêm `POST /api/sessions/bulk`
2. Chưa có English translations (chỉ có Vietnamese)
3. Chưa có unit tests cho BulkSessionDateSelector component
4. Maximum 52 tuần cho recurring mode (có thể extend nếu cần)

## Next Steps

### For Backend Developer

1. Đọc [BULK_SESSION_API.md](BULK_SESSION_API.md)
2. Implement POST `/api/sessions/bulk` endpoint
3. Implement transaction logic (all-or-nothing)
4. Test với các cases trong API documentation
5. Deploy và notify frontend team

### For Frontend Developer (if needed)

1. Add English translations to `src/i18n/messages/en.json`
2. Add Chinese translations to `src/i18n/messages/cn.json`
3. Write unit tests for BulkSessionDateSelector
4. Write integration tests for SessionForm with bulk creation
5. Consider adding loading skeleton during bulk creation

### For QA

1. Follow testing checklist above
2. Test edge cases thoroughly
3. Test with different locales
4. Performance test with large number of sessions (50+)
5. Security test (try to bypass rate limits, create sessions for other users, etc.)

## Contact

If you have questions about this implementation:

- Check [BULK_SESSION_API.md](BULK_SESSION_API.md) for backend details
- Review component code in [src/components/session/BulkSessionDateSelector.tsx](src/components/session/BulkSessionDateSelector.tsx)
- Check translations in [src/i18n/messages/vi.json](src/i18n/messages/vi.json)
