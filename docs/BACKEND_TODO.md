# Backend Implementation TODOs

## 🚨 Critical - Payment System

### 1. Implement Player Payment Endpoint ⚠️ HIGH PRIORITY

**Status:** Not Implemented (404)

**Endpoint:** `GET /api/sessions/:sessionId/my-payments`

**API Spec Reference:** Line 328 in [api-spec-fee-payment.md](./api-spec-fee-payment.md)

**Frontend Usage:**
- File: `src/lib/api/payment.service.ts:20`
- Method: `PaymentService.getMySessionPayments(sessionId)`

**Current Error:**
```json
{
  "success": false,
  "error": {
    "message": "Cannot GET /api/sessions/:id/my-payments",
    "statusCode": 404
  }
}
```

**Expected Behavior:**
- Authenticate user making the request
- Find all payment records for the session where `registeredByUserId` matches authenticated user
- Return array of payment records
- Support multi-slot scenario (user may have multiple payments if they registered multiple slots)

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "playerId": "uuid",
      "registeredByUserId": "uuid",
      "amount": 50000,
      "status": "PENDING",
      "paymentMethod": null,
      "proofImageUrl": null,
      "proofNotes": null,
      "hostNotes": null,
      "submittedAt": null,
      "approvedAt": null,
      "rejectedAt": null,
      "player": {
        "id": "uuid",
        "name": "Player Name",
        "gender": "MALE"
      }
    }
  ]
}
```

**Implementation Notes:**
- Filter by `registeredByUserId = authenticated_user_id`
- Include related player data (name, gender)
- Sort by createdAt DESC
- Return empty array if no payments found (don't return 404)

**Alternative Approach:**
If you want to reuse `/api/sessions/:sessionId/payments`:
- Make it automatically filter by user role
- If requester is HOST → return all payments
- If requester is PLAYER → return only their payments
- Add query parameter `?userId=:id` for HOST to filter by specific user

**Impact:**
- ❌ Players cannot see their payment status
- ❌ Players cannot submit payments
- ❌ Payment tab in PlayerSessionView is broken

---

## 📝 Additional Endpoints Status

### File Upload Endpoints ✅ VERIFIED

| Endpoint | Field Name | Status |
|----------|------------|--------|
| `POST /api/upload/qr-code` | `qrCode` | ✅ Working |
| `POST /api/upload/payment-proof` | `proof` | ✅ Working |

---

### Payment Settings Endpoints ✅ VERIFIED

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/payment-settings` | GET | ✅ Working |
| `/api/payment-settings` | POST | ✅ Working |
| `/api/payment-settings/:id` | PUT | ✅ Working |
| `/api/payment-settings/:id` | DELETE | ✅ Working |
| `/api/payment-settings/:id/set-default` | POST | ✅ Working |

**Note:** PUT validation requires `qrCodeUrl` to be valid URL if provided. Don't send `undefined`.

---

### Fee Configuration Endpoints ⏳ NOT TESTED

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/sessions/:id/fee-config` | GET | ⏳ Not tested |
| `/api/sessions/:id/fee-config` | POST | ⏳ Not tested |
| `/api/sessions/:id/fee-config` | PUT | ⏳ Not tested |
| `/api/sessions/:id/fee-config` | DELETE | ⏳ Not tested |

---

### Payment Records Endpoints ⏳ PARTIALLY TESTED

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/sessions/:id/payments` | GET | ⏳ Not tested (HOST) |
| `/api/sessions/:id/my-payments` | GET | ❌ Not implemented |
| `/api/payments/:id/submit` | POST | ⏳ Not tested |
| `/api/payments/:id/approve` | POST | ⏳ Not tested |
| `/api/payments/:id/reject` | POST | ⏳ Not tested |
| `/api/payments/bulk-approve` | POST | ⏳ Not tested |
| `/api/sessions/:id/payments/split` | POST | ⏳ Not tested |
| `/api/sessions/:id/payments/stats` | GET | ⏳ Not tested |

---

### Transaction Endpoints ⏳ NOT TESTED

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/transactions/summary` | GET | ⏳ Not tested (PLAYER) |
| `/api/transactions/with-host/:hostId` | GET | ⏳ Not tested |
| `/api/host/transactions/summary` | GET | ⏳ Not tested (HOST) |
| `/api/host/transactions/with-user/:userId` | GET | ⏳ Not tested |

---

## 🧪 Testing Recommendations

### 1. Unit Tests

Create tests for:
- Player payment filtering logic
- Multi-slot payment scenarios
- Payment status transitions (PENDING → SUBMITTED → APPROVED/REJECTED)
- Fee calculations (FIXED vs SPLIT_EVENLY)

### 2. Integration Tests

Test full flows:
- Host creates session with fee → Player joins → Payment record created
- Player submits payment → Host approves → Status updated
- Player registers multiple slots → Multiple payment records
- Split evenly fee → Host sets total → All amounts updated

### 3. API Tests

Use Postman/Insomnia to test:
- All endpoints return correct status codes
- Error handling for invalid inputs
- Authentication/authorization
- Data relationships (cascade deletes, etc.)

---

## 📚 References

- [API Spec](./api-spec-fee-payment.md) - Complete backend specification
- [Payment API Reference](./payment-api-reference.md) - Frontend documentation
- [API Endpoints Changelog](./API_ENDPOINTS_CHANGELOG.md) - Recent changes and fixes

---

**Last Updated:** 2026-01-28
**Priority:** HIGH - Player payment endpoint blocks core functionality
