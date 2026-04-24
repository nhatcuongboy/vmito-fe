# Session Edit Restrictions - IN_PROGRESS Status

## Current Implementation

### Fields Currently Disabled (When `IN_PROGRESS`)

```typescript
const isSessionActive = initialData?.status === SessionStatus.IN_PROGRESS;
const canEditCourts = initialData?.status === SessionStatus.PREPARING;
const canEditTime = !isSessionActive;
```

**Currently Blocked:**

- ✅ Start Time
- ✅ End Time
- ✅ Date (single-day mode)
- ✅ Multi-day Toggle
- ✅ Add Court Button
- ✅ Court Number (in each court)
- ✅ Court Name (in each court)
- ✅ Court Direction (hidden anyway)

---

## Recommended Restrictions When Session is IN_PROGRESS

### 🔒 MUST BE LOCKED (Cannot Change)

1. **Time-related Fields** ✅ _Already locked_
   - Start Time
   - End Time
   - Date
   - Multi-day Toggle
   - **Reason:** Session has already begun; changing times would be confusing and affect timing logic

2. **Core Infrastructure** ✅ _Partially locked (courts)_
   - Number of Courts
   - Court Number
   - Court Name
   - Court Direction
   - Max Players Per Court
   - **Reason:** Physical court setup and capacity cannot change mid-session

3. **Venue/Location** ❌ _Currently NOT locked_
   - Venue/Location
   - **Reason:** Physical location is fixed once players arrive

4. **Fee Configuration** ❌ _Currently NOT locked_
   - Fee Enabled/Disabled
   - Fee Type
   - Male Fee
   - Female Fee
   - Fee Notes
   - **Reason:** Session already started; changing fees mid-way is not fair to players who already paid or planned to pay

5. **Session Rules & Eligibility** ❌ _Currently NOT locked_
   - Required Levels
   - Allow New Players (⚠️ **CRITICAL**)
   - Require Player Info
   - **Reason:** These affect who can join; changing mid-session creates confusion about eligibility

---

### 🟡 SHOULD ALLOW EDITING (Operational/Cosmetic)

1. **Session Description**
   - **Reason:** Cosmetic detail that doesn't affect session running
   - **Use Case:** Update rules or additional info during session

2. **Host Name**
   - **Reason:** Might need to update if host changes (rare but possible)
   - **Use Case:** Co-host takes over

3. **Host Phone**
   - **Reason:** Contact information, not session logic
   - **Use Case:** Update contact if needed

4. **Default Match Type**
   - **Reason:** Could argue both ways, but currently affects match setup
   - **Recommendation:** LOCK this (affects match generation logic)

5. **Shuttlecock**
   - **Reason:** Operational detail; can be updated in real-time
   - **Use Case:** "We switched to shuttle brand X"

6. **Court Color**
   - **Reason:** Purely cosmetic
   - **Use Case:** Visual preference

7. **Session Name**
   - **Reason:** Informational only; doesn't affect session logic
   - **Use Case:** "League Finals" → "League Finals - Round 2"

8. **Cover Photo & Images**
   - **Reason:** Cosmetic
   - **Use Case:** Add photos during session

9. **Allow Guest Join**
   - **Recommendation:** LOCK this (affects player eligibility)
   - **Reason:** Shouldn't change mid-session

---

## Proposed Restrictions

### Summary of What Should Be Locked When IN_PROGRESS

| Field                          | Current   | Recommended | Reason                   |
| ------------------------------ | --------- | ----------- | ------------------------ |
| **Session Name**               | Allowed   | Allow       | Informational only       |
| **Description**                | Allowed   | Allow       | Cosmetic                 |
| **Session Images/Cover Photo** | Allowed   | Allow       | Cosmetic                 |
| **Location/Venue**             | Allowed   | ❌ **Lock** | Physical location fixed  |
| **Start Time**                 | ✅ Locked | Keep Locked | Session already started  |
| **End Time**                   | ✅ Locked | Keep Locked | Session timing           |
| **Multi-day Toggle**           | ✅ Locked | Keep Locked | Time configuration       |
| **Number of Courts**           | ✅ Locked | Keep Locked | Infrastructure           |
| **Court Numbers**              | ✅ Locked | Keep Locked | Infrastructure           |
| **Court Names**                | ✅ Locked | Keep Locked | Infrastructure           |
| **Court Direction**            | ✅ Locked | Keep Locked | Infrastructure (hidden)  |
| **Max Players Per Court**      | Allowed   | ❌ **Lock** | Core capacity            |
| **Default Match Type**         | Allowed   | ❌ **Lock** | Affects match generation |
| **Required Levels**            | Allowed   | ❌ **Lock** | Affects eligibility      |
| **Allow Guest Join**           | Allowed   | ❌ **Lock** | Affects eligibility      |
| **Allow New Players**          | Allowed   | ❌ **Lock** | Affects who can join     |
| **Require Player Info**        | Allowed   | ❌ **Lock** | Affects joining flow     |
| **Shuttlecock**                | Allowed   | Allow       | Operational detail       |
| **Court Color**                | Allowed   | Allow       | Cosmetic                 |
| **Host Name**                  | Allowed   | Allow       | Can update if co-host    |
| **Host Phone**                 | Allowed   | Allow       | Contact info             |
| **Fee Config**                 | Allowed   | ❌ **Lock** | Already running/earning  |

---

## Implementation Notes

### Backend Validation Needed

Current backend (`sessions.service.ts`) has **NO restrictions** on what can be updated during `IN_PROGRESS`. Should add:

```typescript
// In updateSession method
if (existingSession.status === 'IN_PROGRESS') {
  const lockedFields = [
    'startTime',
    'endTime',
    'numberOfCourts',
    'maxPlayersPerCourt',
    'requiredLevels',
    'allowGuestJoin',
    'allowNewPlayers',
    'requirePlayerInfo',
    'defaultMatchType',
    'venue',
    'feeConfig',
  ];

  lockedFields.forEach((field) => {
    if (
      updateSessionDto[field] !== undefined &&
      updateSessionDto[field] !== existingSession[field]
    ) {
      throw new BadRequestException(
        `Cannot modify '${field}' while session is IN_PROGRESS`
      );
    }
  });
}
```

### Frontend Implementation

Update `SessionForm.tsx`:

```typescript
// Define locked fields for IN_PROGRESS status
const getLockedFieldsForStatus = (status: SessionStatus): string[] => {
  if (status === SessionStatus.IN_PROGRESS) {
    return [
      'selectedVenueId',
      'startTime',
      'endTime',
      'courts',
      'maxPlayersPerCourt',
      'defaultMatchType',
      'requiredLevels',
      'allowGuestJoin',
      'allowNewPlayers',
      'requirePlayerInfo',
      // Fee fields handled separately
    ];
  }
  return [];
};

// Use in form rendering
const isFieldLocked = (fieldName: string): boolean => {
  return getLockedFieldsForStatus(initialData?.status).includes(fieldName);
};
```

---

## User Experience Impact

**Warning Banner** (already exists):

- ⚠️ "Cannot edit time while session is IN_PROGRESS"

**Suggested Enhancement:**

- Expand warning to list ALL locked fields
- Show reason for each restriction

---

## Related Components

- `SessionEditForm.tsx` - Wrapper component
- `SessionForm.tsx` - Main form (lines 228-240 have current logic)
- `sessions.service.ts` (Backend) - No current restrictions
- `SessionOverviewTab.tsx` - Shows edit button in drawer
