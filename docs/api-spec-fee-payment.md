# API Specification: Session Fee & Payment Management

## Overview
This document describes the backend API endpoints needed to support the session fee and payment management feature.

---

## Data Models

### Enums

```typescript
enum FeeType {
  FIXED = 'FIXED',           // Fixed price per gender
  SPLIT_EVENLY = 'SPLIT_EVENLY'  // Split total evenly among players
}

enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

enum PaymentStatus {
  PENDING = 'PENDING',       // Player hasn't paid yet
  SUBMITTED = 'SUBMITTED',   // Player marked as paid, waiting for host approval
  APPROVED = 'APPROVED',     // Host approved the payment
  REJECTED = 'REJECTED'      // Host rejected the payment
}
```

### Database Tables

#### session_fee_configs
```sql
CREATE TABLE session_fee_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  fee_type VARCHAR(20) NOT NULL, -- 'FIXED' or 'SPLIT_EVENLY'
  male_fee INTEGER, -- Fee for male players (in VND), nullable for SPLIT_EVENLY
  female_fee INTEGER, -- Fee for female players (in VND), nullable for SPLIT_EVENLY
  split_total INTEGER, -- Total amount to split (for SPLIT_EVENLY), set after session
  split_per_player INTEGER, -- Calculated amount per player (for SPLIT_EVENLY)
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id)
);
```

#### host_payment_settings
```sql
CREATE TABLE host_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  account_holder_name VARCHAR(100),
  qr_code_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure only one default per user
CREATE UNIQUE INDEX idx_one_default_per_user
ON host_payment_settings(user_id)
WHERE is_default = true;
```

#### payment_records
```sql
CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  registered_by_user_id UUID REFERENCES users(id), -- User who registered this player (for multi-slot)
  host_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL, -- Amount in VND
  payment_method VARCHAR(20), -- 'CASH' or 'BANK_TRANSFER'
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  proof_image_url TEXT,
  proof_notes TEXT,
  host_notes TEXT,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);
```

---

## API Endpoints

### 1. Session Fee Configuration

#### GET /api/sessions/:sessionId/fee-config
Get fee configuration for a session.

**Response:**
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "feeType": "FIXED",
  "maleFee": 50000,
  "femaleFee": 40000,
  "splitTotal": null,
  "splitPerPlayer": null,
  "notes": "Fee includes water",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Response (404):** Session has no fee config

---

#### POST /api/sessions/:sessionId/fee-config
Create fee configuration for a session. Only session host can create.

**Request Body:**
```json
{
  "feeType": "FIXED",
  "maleFee": 50000,
  "femaleFee": 40000,
  "notes": "Fee includes water"
}
```

Or for SPLIT_EVENLY:
```json
{
  "feeType": "SPLIT_EVENLY",
  "notes": "Will calculate after session"
}
```

**Response (201):** Created fee config object

**Errors:**
- 403: Not session host
- 409: Fee config already exists

---

#### PUT /api/sessions/:sessionId/fee-config
Update fee configuration. Only session host can update.

**Request Body:** Same as POST

**Response:** Updated fee config object

**Side Effects:**
- If changing from FIXED to SPLIT_EVENLY or vice versa, recalculate all payment_records amounts
- If updating maleFee/femaleFee, update affected payment_records

---

#### DELETE /api/sessions/:sessionId/fee-config
Delete fee configuration. Only session host can delete.

**Response:** 204 No Content

**Side Effects:**
- Delete all associated payment_records

---

### 2. Host Payment Settings

#### GET /api/payment-settings
Get all payment settings for the authenticated host.

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "bankName": "Vietcombank",
    "bankAccountNumber": "1234567890",
    "accountHolderName": "NGUYEN VAN A",
    "qrCodeUrl": "https://...",
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

#### GET /api/payment-settings/default
Get the default payment setting for the authenticated host.

**Response:** Single payment setting object or null

---

#### GET /api/hosts/:hostId/payment-settings
Get the default payment setting for a specific host. Used by players to see payment info.

**Response:** Single payment setting object (only default one) or null

---

#### POST /api/payment-settings
Create a new payment setting.

**Request Body:**
```json
{
  "bankName": "Vietcombank",
  "bankAccountNumber": "1234567890",
  "accountHolderName": "NGUYEN VAN A",
  "qrCodeUrl": "https://...",
  "isDefault": true
}
```

**Response (201):** Created payment setting

**Side Effects:**
- If isDefault=true, set all other settings for this user to isDefault=false

---

#### PUT /api/payment-settings/:id
Update a payment setting.

**Request Body:** Same as POST (all fields optional)

**Response:** Updated payment setting

---

#### DELETE /api/payment-settings/:id
Delete a payment setting.

**Response:** 204 No Content

---

#### POST /api/payment-settings/:id/set-default
Set a payment setting as default.

**Response:** Updated payment setting with isDefault=true

**Side Effects:**
- Set all other settings for this user to isDefault=false

---

#### POST /api/upload/qr-code
Upload a QR code image.

**Request:** multipart/form-data with file field "qrCode"

**Response:**
```json
{
  "url": "https://storage.example.com/qr-codes/abc123.png"
}
```

---

### 3. Payment Records

#### GET /api/sessions/:sessionId/payments
Get all payment records for a session. Only session host can access.

**Query Parameters:**
- `status`: Filter by status (PENDING, SUBMITTED, APPROVED, REJECTED)

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "playerId": "uuid",
      "registeredByUserId": "uuid",
      "hostId": "uuid",
      "amount": 50000,
      "paymentMethod": "BANK_TRANSFER",
      "status": "SUBMITTED",
      "proofImageUrl": "https://...",
      "proofNotes": "Transferred at 10am",
      "hostNotes": null,
      "submittedAt": "2024-01-01T10:00:00Z",
      "approvedAt": null,
      "rejectedAt": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "player": {
        "id": "uuid",
        "name": "Player Name",
        "gender": "MALE",
        "user": {
          "id": "uuid",
          "name": "User Name",
          "image": "https://..."
        }
      }
    }
  ],
  "stats": {
    "total": 10,
    "pending": 3,
    "submitted": 2,
    "approved": 4,
    "rejected": 1,
    "totalAmount": 500000,
    "paidAmount": 200000
  }
}
```

---

#### GET /api/sessions/:sessionId/my-payments
Get payment records for the authenticated player in a session.

**Response:**
```json
[
  {
    "id": "uuid",
    "sessionId": "uuid",
    "playerId": "uuid",
    "amount": 50000,
    "status": "PENDING",
    ...
    "player": {
      "id": "uuid",
      "name": "Slot 1 - My Name"
    }
  }
]
```

**Note:** Returns multiple records if user registered multiple slots.

---

#### POST /api/payments/:id/submit
Player submits payment (marks as paid).

**Request Body:**
```json
{
  "paymentMethod": "BANK_TRANSFER",
  "proofImageUrl": "https://...",
  "proofNotes": "Transferred at 10am"
}
```

**Response:** Updated payment record

**Validation:**
- Only the player or the user who registered them can submit
- Status must be PENDING or REJECTED (can resubmit after rejection)

**Side Effects:**
- Set status to SUBMITTED
- Set submittedAt to now

---

#### POST /api/payments/:id/approve
Host approves a payment.

**Request Body:**
```json
{
  "hostNotes": "Confirmed received"
}
```

**Response:** Updated payment record

**Validation:**
- Only session host can approve
- Status must be SUBMITTED

**Side Effects:**
- Set status to APPROVED
- Set approvedAt to now

---

#### POST /api/payments/:id/reject
Host rejects a payment.

**Request Body:**
```json
{
  "hostNotes": "Amount incorrect, please transfer 50000 VND"
}
```

**Response:** Updated payment record

**Validation:**
- Only session host can reject
- Status must be SUBMITTED

**Side Effects:**
- Set status to REJECTED
- Set rejectedAt to now

---

#### POST /api/payments/bulk-approve
Host approves multiple payments at once.

**Request Body:**
```json
{
  "paymentIds": ["uuid1", "uuid2", "uuid3"],
  "hostNotes": "Confirmed all"
}
```

**Response:**
```json
{
  "approved": 3,
  "failed": 0
}
```

---

#### POST /api/upload/payment-proof
Upload a payment proof image.

**Request:** multipart/form-data with file field "proof"

**Response:**
```json
{
  "url": "https://storage.example.com/payment-proofs/abc123.png"
}
```

---

### 4. Transaction Summary

#### GET /api/transactions/summary
Get transaction summary for the authenticated player, grouped by host.

**Response:**
```json
[
  {
    "hostId": "uuid",
    "hostName": "Host Name",
    "totalSessions": 5,
    "totalAmount": 250000,
    "paidAmount": 200000,
    "pendingAmount": 50000
  }
]
```

---

#### GET /api/transactions/with-host/:hostId
Get detailed transactions between player and a specific host.

**Response:**
```json
{
  "host": {
    "id": "uuid",
    "name": "Host Name"
  },
  "payments": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "amount": 50000,
      "status": "APPROVED",
      "session": {
        "id": "uuid",
        "name": "Session Name",
        "startTime": "2024-01-01T18:00:00Z"
      }
    }
  ],
  "summary": {
    "totalAmount": 250000,
    "paidAmount": 200000,
    "pendingAmount": 50000
  }
}
```

---

#### GET /api/host/transactions/summary
Get transaction summary for the authenticated host, grouped by player/user.

**Response:**
```json
[
  {
    "userId": "uuid",
    "userName": "Player Name",
    "userImage": "https://...",
    "totalSessions": 5,
    "totalAmount": 250000,
    "paidAmount": 200000,
    "pendingAmount": 50000
  }
]
```

---

#### GET /api/host/transactions/with-user/:userId
Get detailed transactions between host and a specific user.

**Response:** Similar structure to player version

---

### 5. Session Integration

#### When a player joins a session with fee config:
1. Create a payment_record with:
   - amount: calculated based on feeType and player gender
   - status: PENDING
   - registeredByUserId: the user who registered (for multi-slot tracking)

#### When calculating fee for FIXED type:
```javascript
function calculateFee(feeConfig, playerGender, slots = 1) {
  if (feeConfig.feeType === 'FIXED') {
    const feePerSlot = playerGender === 'FEMALE'
      ? feeConfig.femaleFee
      : feeConfig.maleFee;
    return feePerSlot * slots;
  }
  return 0; // SPLIT_EVENLY calculated later
}
```

#### When host sets split total (SPLIT_EVENLY):
1. Update session_fee_configs.split_total
2. Calculate split_per_player = split_total / total_players
3. Update all payment_records.amount for this session

---

## WebSocket Events (Optional)

For real-time updates:

```javascript
// When payment status changes
socket.emit('payment:updated', {
  sessionId: 'uuid',
  paymentId: 'uuid',
  status: 'APPROVED'
});

// When host sets split amount
socket.emit('fee:splitCalculated', {
  sessionId: 'uuid',
  splitPerPlayer: 50000
});
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "PAYMENT_NOT_FOUND",
    "message": "Payment record not found"
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Not authenticated
- `FORBIDDEN`: Not authorized to perform this action
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `CONFLICT`: Resource already exists
