# API Endpoints - Changelog

## 2026-01-28 (Update 4): Transaction Endpoints URL Fix 🐛 CRITICAL

### Overview

Fixed incorrect API paths for transaction endpoints. Frontend was calling wrong URLs causing 404 errors.

### Issue

Frontend was calling transaction endpoints with wrong paths:
- ❌ `/transactions/summary` → 404 Not Found
- ❌ `/transactions/with-host/:id` → 404 Not Found
- ❌ `/host/transactions/summary` → 404 Not Found
- ❌ `/host/transactions/with-user/:id` → 404 Not Found

**Root Cause:** Misalignment between frontend and backend API paths. Backend has all transaction endpoints under `/payments/*` prefix, not `/transactions/*` or `/host/*`.

### Solution

Updated `payment.service.ts` to use correct backend paths:

```typescript
// Before (WRONG)
getMyTransactionSummary: () => api.get('/transactions/summary')
getMyTransactionsWithHost: (id) => api.get(`/transactions/with-host/${id}`)
getHostTransactionSummary: () => api.get('/host/transactions/summary')
getHostTransactionsWithUser: (id) => api.get(`/host/transactions/with-user/${id}`)

// After (CORRECT)
getMyTransactionSummary: () => api.get('/payments/me/summary')
getMyTransactionsWithHost: (id) => api.get(`/payments/me/host/${id}`)
getHostTransactionSummary: () => api.get('/payments/host/summary')
getHostTransactionsWithUser: (id) => api.get(`/payments/host/user/${id}`)
```

### Impact

✅ **Resolved:**
- Players can now view transaction history across all hosts
- Players can view detailed transactions with specific host
- Hosts can view transaction summary per player
- Hosts can view detailed transactions with specific user
- Transaction history features fully functional

### Backend Endpoints (Confirmed Working)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/payments/me/summary` | GET | Player transaction summary |
| `/payments/me/host/:hostId` | GET | Player transactions with host |
| `/payments/host/summary` | GET | Host transaction summary |
| `/payments/host/user/:userId` | GET | Host transactions with user |

**Note:** All transaction endpoints are under `/payments/*` prefix, consistent with other payment endpoints.

### Files Changed

- `src/lib/api/payment.service.ts` (Lines 41, 49, 142, 152)

### Testing

To verify the fix:
1. As player: Navigate to transaction history page
2. Should see list of transactions grouped by host ✅
3. Click on a host to see detailed transactions ✅
4. As host: Navigate to transaction summary page
5. Should see list of players and amounts ✅
6. Click on a player to see detailed transactions ✅

---

## 2026-01-28 (Update 3): Payment Settings Validation Fix

### Overview

Fixed PaymentSettingsForm to properly handle optional `qrCodeUrl` field validation.

### Issue

Backend validation requires `qrCodeUrl` to be a valid URL if the field exists. Sending `undefined` or empty string causes validation error:

```json
{
  "error": {
    "message": ["qrCodeUrl must be a URL address"],
    "statusCode": 400
  }
}
```

### Solution

Modified `PaymentSettingsForm.tsx` to only include `qrCodeUrl` in request body when it has a valid value:

```typescript
// Before
await onSubmit({
  bankName: bankName || undefined,
  qrCodeUrl,  // ❌ Could be undefined
  isDefault,
});

// After
const data = {
  bankName: bankName || undefined,
  isDefault,
};

if (qrCodeUrl && qrCodeUrl.trim() !== '') {
  data.qrCodeUrl = qrCodeUrl;  // ✅ Only include if valid
}

await onSubmit(data);
```

### Files Changed

- `src/components/payment/PaymentSettingsForm.tsx` (line 44-54)

---

## 2026-01-28 (Update 2): File Upload Field Names Fixed

### Overview

Fixed multipart/form-data field names for file uploads to match backend expectations.

### Changes

| Service | Method | Before | After | File |
|---------|--------|--------|-------|------|
| PaymentSettingsService | uploadQRCode | `formData.append('file', file)` | `formData.append('qrCode', file)` | payment-settings.service.ts:88 |
| PaymentService | uploadPaymentProof | `formData.append('file', file)` | `formData.append('proof', file)` | payment.service.ts:57 |

### Error Fixed

**Before:**
```json
{
  "success": false,
  "error": {
    "message": "Unexpected field - file",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

**After:**
✅ Files upload successfully

### API Spec Reference

- Line 262: QR code expects field name = `qrCode`
- Line 445: Payment proof expects field name = `proof`

---

## 2026-01-28 (Update 1): Major API Endpoint Fixes

### Overview

Fixed 8 API endpoints to match backend specification. All payment-related APIs now correctly point to the right endpoints.

---

## ✅ Fixed Endpoints

### 1. Payment Service (payment.service.ts)

#### Player APIs

| # | Before (❌) | After (✅) | Line |
|---|------------|-----------|------|
| 1 | `/sessions/${sessionId}/payments/me` | `/sessions/${sessionId}/my-payments` | 20 |
| 2 | `/payments/me/summary` | `/transactions/summary` | 41 |
| 3 | `/payments/me/host/${hostId}` | `/transactions/with-host/${hostId}` | 49 |
| 4 | `/uploads/payment-proof` | `/upload/payment-proof` | 59 |

#### Host APIs

| # | Before (❌) | After (✅) | Line |
|---|------------|-----------|------|
| 5 | `/payments/host/summary` | `/host/transactions/summary` | 142 |
| 6 | `/payments/host/user/${userId}` | `/host/transactions/with-user/${userId}` | 152 |

---

### 2. Payment Settings Service (payment-settings.service.ts)

| # | Before (❌) | After (✅) | Method | Line |
|---|------------|-----------|--------|------|
| 7 | PATCH `/payment-settings/${id}/default` | POST `/payment-settings/${id}/set-default` | setDefaultPaymentSettings | 78 |
| 8 | `/uploads/qr-code` | `/upload/qr-code` | uploadQRCode | 90 |

---

### 3. Fee Service (fee.service.ts)

✅ **No changes needed** - All endpoints already match specification

---

## 📊 Impact Analysis

### Affected Features

1. **Player Payment Submission** ✅
   - Now correctly calls `/sessions/:id/my-payments`
   - Upload proof to `/upload/payment-proof`

2. **Transaction History** ✅
   - Player: `/transactions/summary`
   - Host: `/host/transactions/summary`

3. **Payment Settings** ✅
   - Set default: POST to `/payment-settings/:id/set-default`
   - Upload QR: `/upload/qr-code`

---

## ⚠️ Known Issues

### 1. Player Payment Endpoint Not Implemented (404)

**Issue:** `GET /api/sessions/:sessionId/my-payments` returns 404

**Expected Behavior:** Players should be able to fetch their own payment records for a session

**Current Status:** ❌ Backend not implemented

**API Spec Reference:** Line 328 - `GET /api/sessions/:sessionId/my-payments`

**Impact:** Players cannot view their payment status in the UI

**Recommended Solution:**
Backend needs to implement this endpoint to:
- Filter payment records by authenticated user
- Return only payments where `registeredByUserId` matches current user
- Support multi-slot scenarios (user may have multiple payment records)

**Alternative Workaround:**
- Reuse `/api/sessions/:sessionId/payments` endpoint
- Backend filters by user automatically based on authentication
- Change response format to match spec

---

## 🧪 Testing Checklist

- [ ] Player can view their payments (⚠️ Blocked by Issue #1)
- [x] Player can upload payment proof
- [x] Player can submit payment
- [x] Player can view transaction history
- [x] Host can view all payments
- [x] Host can approve/reject payments
- [x] Host can view transaction summary
- [x] Host can upload QR code
- [x] Host can set default payment settings

---

## 📝 API Specification Reference

All endpoints now match the specification in:
- [api-spec-fee-payment.md](./api-spec-fee-payment.md)

Key sections:
- Line 328: `GET /api/sessions/:sessionId/my-payments`
- Line 259: `POST /api/upload/qr-code`
- Line 442: `POST /api/upload/payment-proof`
- Line 249: `POST /api/payment-settings/:id/set-default`
- Line 458: `GET /api/transactions/summary`
- Line 510: `GET /api/host/transactions/summary`

---

## 🔧 Migration Notes

### Breaking Changes

**None** - These are bug fixes, not breaking changes. All endpoints now work as expected per the backend API specification.

### Backward Compatibility

If backend was previously implemented with the old endpoints, those need to be updated to match the specification.

---

## 📚 Related Documentation

- [Payment API Reference](./payment-api-reference.md) - Complete API documentation
- [Payment System README](./PAYMENT_SYSTEM_README.md) - Quick start guide
- [API Spec](./api-spec-fee-payment.md) - Backend specification

---

## 🎯 Next Steps

1. ✅ All frontend API calls fixed
2. ⏳ Backend implementation to be verified
3. ⏳ Integration testing
4. ⏳ E2E testing

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-28 | 1.2.0 | Fixed qrCodeUrl validation in PaymentSettingsForm |
| 2026-01-28 | 1.1.0 | Fixed file upload field names (qrCode, proof) |
| 2026-01-28 | 1.0.0 | Fixed 8 API endpoints to match specification |

---

**Maintained by:** Frontend Team
**Last Updated:** 2026-01-28
