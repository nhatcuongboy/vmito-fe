---

## Migration đã tạo

File: migration.sql

Apply migration trên server:
```bash
npx prisma migrate deploy
```

---

## Testing Flow đầy đủ

### 1. Setup — Apply migration + chạy server

```bash
# Backend
npx prisma migrate deploy
pnpm start:dev

# Frontend (terminal khác)
pnpm dev
```

---

### 2. Test: Start Reminder

**Mục tiêu**: Host nhận thông báo khi đến giờ bắt đầu dự kiến mà chưa start session.

**Cách tạo session có `scheduledStartTime`**:

```sql
-- Tạo session với scheduledStartTime = 2 phút nữa để test nhanh
UPDATE sessions
SET "scheduledStartTime" = NOW() + INTERVAL '2 minutes'
WHERE id = '<session_id>' AND status = 'PREPARING';
```

**Kiểm tra kết quả sau 2 phút**:

- [ ] Host nhận push notification "Đã đến giờ bắt đầu buổi tập"
- [ ] `startReminderSentAt` được set trong DB
- [ ] Cron KHÔNG gửi reminder lần 2 (do `startReminderSentAt` không null)

---

### 3. Test: Auto-Cancel (30 phút sau scheduledStartTime, host không start)

```sql
-- Giả lập: scheduledStartTime đã qua 31 phút
UPDATE sessions
SET "scheduledStartTime" = NOW() - INTERVAL '31 minutes',
    "startReminderSentAt" = NOW() - INTERVAL '30 minutes'
WHERE id = '<session_id>' AND status = 'PREPARING';
```

**Kiểm tra**:

- [ ] Session status → `CANCELLED`
- [ ] `cancelledAt` được set
- [ ] UI hiện banner "Đã huỷ"
- [ ] Header màu xám, ẩn action menu

---

### 4. Test: End Warning (15 phút trước `scheduledEndTime`)

```sql
-- Giả lập session đang chạy, sắp hết giờ sau 14 phút
UPDATE sessions
SET "scheduledEndTime" = NOW() + INTERVAL '14 minutes'
WHERE id = '<session_id>' AND status = 'IN_PROGRESS';
```

**Kiểm tra**:

- [ ] Host nhận notification "Còn 15 phút là hết giờ"
- [ ] `endWarningSentAt` được set
- [ ] Cron không gửi lại lần 2

---

### 5. Test: Overtime UI

```sql
-- Giả lập session đã qua scheduledEndTime nhưng chưa end
UPDATE sessions
SET "scheduledEndTime" = NOW() - INTERVAL '5 minutes'
WHERE id = '<session_id>' AND status = 'IN_PROGRESS';
```

**Kiểm tra trên UI**:

- [ ] Header đổi màu cam
- [ ] Label `(overtime)` xuất hiện bên cạnh tên session
- [ ] Banner cam "Buổi tập đang overtime" hiện ở Overview tab
- [ ] Button "End Session" → đổi thành **"End & Finalize"** màu cam
- [ ] Cron có thể tự auto-finalize sau `gracePeriodEnd`

---

### 6. Test: Cancel thủ công (host cancel khi PREPARING)

- [ ] Vào session đang `PREPARING` → Overview tab
- [ ] Click nút **"Cancel Session"** (outline đỏ)
- [ ] Confirm dialog xuất hiện
- [ ] Session status → `CANCELLED`
- [ ] Banner xám "Đã huỷ" hiện lên
- [ ] Nút Start/End biến mất

---

### 7. Kiểm tra không gửi duplicate notifications

```sql
-- Verify chỉ gửi 1 lần
SELECT id, name, "startReminderSentAt", "endWarningSentAt", "cancelledAt"
FROM sessions WHERE id = '<session_id>';
```

---

### Xem cron log realtime

```bash
# Backend logs
pnpm start:dev 2>&1 | grep -E "StartReminder|EndWarning|AutoCancel|AutoFinalize"
```
