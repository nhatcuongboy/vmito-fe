# Payment System - Quick Start Guide

## 📚 Tài liệu

- **[Payment API Reference](./payment-api-reference.md)** - Tài liệu đầy đủ về tất cả API endpoints
- **[API Spec](./api-spec-fee-payment.md)** - Backend API specification

---

## 🎯 Tổng quan

Payment system cho phép Host thu phí và quản lý thanh toán từ Players.

### Các tính năng chính

1. **Fee Configuration** (Cấu hình phí)
   - Fixed price theo giới tính (Male/Female)
   - Split evenly - Chia đều tổng chi phí

2. **Payment Settings** (Thông tin chuyển khoản)
   - Mỗi Host có payment settings riêng
   - Thông tin: Ngân hàng, STK, Tên chủ TK, QR code

3. **Payment Management** (Quản lý thanh toán)
   - Player submit payment với proof image
   - Host approve/reject payments
   - Transaction history tracking

---

## 🚀 Quick Start

### 1. Host: Cấu hình Payment Settings

```typescript
// Trang: /host/payment-settings
import { PaymentSettingsService } from '@/lib/api/payment-settings.service';

// Upload QR code
const qrUrl = await PaymentSettingsService.uploadQRCode(file);

// Tạo payment settings
await PaymentSettingsService.createPaymentSettings({
  bankName: 'Vietcombank',
  bankAccountNumber: '1234567890',
  accountHolderName: 'NGUYEN VAN A',
  qrCodeUrl: qrUrl,
  isDefault: true
});
```

---

### 2. Host: Tạo Session với Fee

```typescript
// Component: SessionForm
import { FeeService } from '@/lib/api/fee.service';

// Trong SessionForm, có SessionFeeConfigForm
// Khi submit, fee config được tạo cùng session

// Hoặc tạo riêng sau:
await FeeService.createSessionFeeConfig(sessionId, {
  feeType: 'FIXED',
  maleFee: 90000,
  femaleFee: 80000,
  notes: 'Phí bao gồm nước'
});
```

---

### 3. Player: Xem và Thanh toán

```typescript
// Component: PaymentInfoTab (trong PlayerSessionView)
import { PaymentService } from '@/lib/api/payment.service';

// Lấy payment records của mình
const payments = await PaymentService.getMySessionPayments(sessionId);

// Upload proof
const proofUrl = await PaymentService.uploadPaymentProof(file);

// Submit payment
await PaymentService.submitPayment(paymentId, {
  paymentMethod: 'BANK_TRANSFER',
  proofImageUrl: proofUrl,
  proofNotes: 'Đã chuyển lúc 10h'
});
```

---

### 4. Host: Duyệt Thanh toán

```typescript
// Component: PaymentTab (trong Host Session)

// Lấy tất cả payments
const payments = await PaymentService.getSessionPayments(sessionId);

// Approve
await PaymentService.approvePayment(paymentId, {
  hostNotes: 'Đã nhận tiền'
});

// Reject
await PaymentService.rejectPayment(paymentId, {
  hostNotes: 'Số tiền không đúng'
});

// Bulk approve
await PaymentService.bulkApprovePayments(['id1', 'id2']);
```

---

## 📁 Cấu trúc Files

```
src/
├── lib/api/
│   ├── fee.service.ts           # Fee configuration APIs
│   ├── payment.service.ts       # Payment records APIs
│   └── payment-settings.service.ts  # Payment settings APIs
│
├── components/
│   ├── fee/
│   │   ├── SessionFeeConfigForm.tsx  # Form cấu hình phí
│   │   └── FeeDisplay.tsx            # Hiển thị phí
│   │
│   ├── payment/
│   │   ├── PaymentSettingsForm.tsx   # Form payment settings
│   │   ├── PaymentInfoTab.tsx        # Tab thanh toán (Player)
│   │   ├── SubmitPaymentModal.tsx    # Modal submit payment
│   │   └── PaymentStatusBadge.tsx    # Badge trạng thái
│   │
│   └── session/
│       ├── SessionForm.tsx           # Form tạo session (có fee config)
│       ├── PaymentTab.tsx            # Tab payment (Host)
│       └── PlayerSessionView.tsx     # View session (Player)
│
└── app/[locale]/
    ├── host/
    │   ├── payment-settings/page.tsx # Trang quản lý payment settings
    │   └── sessions/[id]/page.tsx    # Trang session (có PaymentTab)
    │
    └── player/
        └── sessions/[id]/           # Player view (có PaymentInfoTab)
```

---

## 🔄 Data Flow

### Flow tạo session với phí

```
1. Host opens SessionForm
2. Enable fee config
3. Select fee type (FIXED/SPLIT_EVENLY)
4. Enter amounts (if FIXED)
5. Submit form
6. Backend creates session + fee_config
7. When player joins → payment_record created (PENDING)
```

---

### Flow thanh toán

```
Player Side:
1. View payment info (amount, host bank details, QR code)
2. Transfer money to host's bank account
3. Upload proof image
4. Submit payment → Status: SUBMITTED
5. Wait for host approval

Host Side:
1. View all payments (filter by status)
2. Review proof images
3. Approve or Reject
4. If approved → Status: APPROVED
5. If rejected → Player can resubmit
```

---

## 🎨 UI Components

### Host Session - Payment Tab

![Payment Tab](https://via.placeholder.com/800x400?text=Payment+Tab+Screenshot)

**Features:**
- View fee configuration
- View/edit payment settings
- Link to payment settings page
- Warning if no payment settings

---

### Player Session - Payment Tab

![Payment Info Tab](https://via.placeholder.com/800x400?text=Payment+Info+Tab+Screenshot)

**Features:**
- View fee amount
- View host payment info (bank, QR code)
- Submit payment with proof
- Track payment status

---

## 💡 Tips

### 1. Check Payment Settings trước khi enable fee

```typescript
const settings = await PaymentSettingsService.getDefaultPaymentSettings();
if (!settings) {
  alert('Please configure payment settings first');
  router.push('/host/payment-settings');
}
```

---

### 2. Validate fee amounts

```typescript
if (feeType === 'FIXED') {
  if (!maleFee || maleFee <= 0) {
    // Show error
  }
}
```

---

### 3. Handle multi-slot payments

Khi user đăng ký nhiều slot, sẽ có nhiều payment records:

```typescript
const myPayments = await PaymentService.getMySessionPayments(sessionId);
// myPayments.length có thể > 1

const totalAmount = myPayments.reduce((sum, p) => sum + p.amount, 0);
```

---

### 4. Refresh data after actions

```typescript
// After approve/reject
await fetchPayments();

// After split amount calculation
await fetchPayments();
```

---

## 🐛 Common Issues

### Issue 1: "Unexpected field - file" khi upload

**Error:**
```json
{
  "error": {
    "message": "Unexpected field - file",
    "statusCode": 400
  }
}
```

**Solution:** Backend expect field names cụ thể:
- QR code: `formData.append('qrCode', file)` ✅
- Payment proof: `formData.append('proof', file)` ✅
- NOT: `formData.append('file', file)` ❌

---

### Issue 2: "Cannot POST /api/uploads/payment-proof"

**Solution:** Endpoint đã fix thành `/api/upload/payment-proof` (không có `s`)

---

### Issue 3: Payment settings không hiển thị cho player

**Reason:** Host chưa set payment settings làm default

**Solution:**
```typescript
await PaymentSettingsService.setDefaultPaymentSettings(settingId);
```

---

### Issue 4: "qrCodeUrl must be a URL address" khi update payment settings

**Error:**
```json
{
  "error": {
    "message": ["qrCodeUrl must be a URL address"],
    "statusCode": 400
  }
}
```

**Reason:** Backend validation yêu cầu `qrCodeUrl` phải là URL hợp lệ nếu field tồn tại

**Solution:** ✅ Đã fix - Chỉ gửi `qrCodeUrl` khi có giá trị hợp lệ
```typescript
// PaymentSettingsForm now only includes qrCodeUrl if it has value
if (qrCodeUrl && qrCodeUrl.trim() !== '') {
  data.qrCodeUrl = qrCodeUrl;
}
```

---

### Issue 5: "Cannot GET /api/sessions/:id/my-payments" (404)

**Error:**
```json
{
  "error": {
    "message": "Cannot GET /api/sessions/:id/my-payments",
    "statusCode": 404
  }
}
```

**Reason:** Backend chưa implement endpoint này cho Player

**Expected Endpoint:** `GET /api/sessions/:sessionId/my-payments` (API Spec Line 328)

**Status:** ⏳ Pending backend implementation

**Frontend Solution:** ✅ Graceful error handling implemented
- Frontend hiện thị thông báo thân thiện khi endpoint chưa sẵn sàng
- Error UI với icon và message phù hợp
- Retry button cho network errors
- No crash, no blank screen

**Error Handling:**
```typescript
// src/components/session/PlayerSessionView.tsx
// Detects 404 and shows friendly message:
// "⚠️ Feature Not Available"
// "Payment feature is not yet available on the backend.
//  Please contact the administrator."
```

**Temporary Workaround:**
- Backend có thể reuse endpoint `/api/sessions/:sessionId/payments`
- Backend phải filter payments theo authenticated user
- Hoặc tạo endpoint mới như spec

---

### Issue 6: Fee không tính đúng cho SPLIT_EVENLY

**Reason:** Host chưa set split amount sau khi session kết thúc

**Solution:**
```typescript
await PaymentService.setSplitAmount(sessionId, totalAmount);
```

---

## 📞 Support

- **API Issues:** Kiểm tra [Payment API Reference](./payment-api-reference.md)
- **Backend Spec:** Xem [API Spec](./api-spec-fee-payment.md)
- **Component Usage:** Xem code trong `src/components/`

---

**Last Updated:** 2026-01-28
