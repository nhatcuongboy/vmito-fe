# Plan: Add RequiredLevels Field to Session

## Overview

Add a `requiredLevels` field to the Session table to restrict the levels of players allowed to join a session. This field contains a list of levels from the Level enum, and only players whose level is in this list will be allowed to join the session.

## 📋 Implementation Checklist

### Phase 1: Database Schema & Migration ⚡ ✅ COMPLETED

**Estimated Time: 15-20 minutes**

- [x] **1.1. Update Prisma Schema** ✅
  - File: `prisma/schema.prisma`
  - Add `requiredLevels` field to `Session` model:
    ```prisma
    model Session {
      // ... existing fields
      requiredLevels     Level[]       @default([])  // Empty array = all levels allowed
      // ... existing fields
    }
    ```
  - This field:
    - Is an array of Level enum values
    - Defaults to empty array (allows all levels)
    - When populated, only players with levels in this list can join

- [x] **1.2. Create Migration** ✅

  ```bash
  npx prisma migrate dev --name add_required_levels_to_session
  ```

  - Migration created: `20251015121906_add_required_levels_to_session`
  - SQL: `ALTER TABLE "public"."sessions" ADD COLUMN "requiredLevels" "public"."Level"[] DEFAULT ARRAY[]::"public"."Level"[];`

- [x] **1.3. Generate Prisma Client** ✅

  ```bash
  npx prisma generate
  ```

  - Prisma Client generated successfully
  - Type verified: `requiredLevels: $Enums.Level[]`

---

### Phase 2: TypeScript Types & Interfaces 📝 ✅ COMPLETED

**Estimated Time: 10-15 minutes**

- [x] **2.1. Update Type Definitions** ✅
  - File: `src/lib/api/types.ts`
  - Add `requiredLevels` to `ISession` interface:
    ```typescript
    export interface ISession {
      // ... existing fields
      requiredLevels?: Level[]; // Optional: empty array or undefined = all levels allowed
      // ... existing fields
    }
    ```
  - ✅ Added at line 48 in ISession interface

- [x] **2.2. Update CreateSessionRequest** ✅
  - File: `src/lib/api/types.ts`
  - Add `requiredLevels` field (optional):
    ```typescript
    export interface CreateSessionRequest {
      // ... existing fields
      requiredLevels?: Level[];
      // ... existing fields
    }
    ```
  - ✅ Added at line 193 in CreateSessionRequest interface
  - ✅ No TypeScript errors detected

---

### Phase 3: Backend API Updates 🔧 ✅ COMPLETED

**Estimated Time: 30-40 minutes**

#### 3.1. Create Session API ✅

- [x] **File: `src/app/api/sessions/route.ts`**
  - Added `requiredLevels` to POST handler (line 48)
  - Extracts `requiredLevels = []` from request body
  - Passes to Prisma session.create (line 85)

#### 3.2. Update Session API ✅

- [x] **File: `src/app/api/sessions/[id]/route.ts`**
  - Added `requiredLevels` to PUT handler (line 194)
  - Allows updating `requiredLevels` field (line 207)
  - Uses conditional update: `requiredLevels !== undefined ? requiredLevels : undefined`

#### 3.3. Player Join Validation ✅

- [x] **File: `src/app/api/sessions/[id]/players/route.ts`**
  - Updated session query to include `requiredLevels` (line 86-89)
  - Added validation logic (lines 110-125):
    - Checks if session has required levels
    - Validates player has a level if required
    - Validates player level is in allowed list
  - Error messages:
    - "This session requires players to have one of these levels: ..."
    - "Your level (X) is not allowed in this session. Required levels: ..."

#### 3.4. Bulk Player Validation ✅

- [x] **File: `src/app/api/sessions/[id]/players/bulk/route.ts`**
  - Updated session query to log `requiredLevels` (line 62)
  - Added level validation in loop (lines 144-156):
    - Checks each player's level against session requirements
    - Provides detailed error messages per player
    - Format: "Player N: level is required/not allowed..."

#### 3.5. Join-Guest Endpoint

- [x] **File: `src/app/api/sessions/[id]/join-guest/route.ts`**
  - ✅ Already deprecated - no changes needed
  - Uses `/api/join-by-code` instead

---

### Phase 4: Frontend Service Layer 🔄 ✅ COMPLETED

**Estimated Time: 10-15 minutes**

- [x] **4.1. Update SessionService** ✅
  - File: `src/lib/api/session.service.ts`
  - ✅ Added JSDoc documentation for methods handling `requiredLevels`:
    - `createSession()` - Accepts requiredLevels via CreateSessionRequest (line 86)
    - `updateSession()` - Accepts requiredLevels via Partial<ISession> (line 97)
    - `getSession()` - Returns requiredLevels in ISession response (line 74)
  - ✅ All methods already support requiredLevels through TypeScript types:
    - `CreateSessionRequest` includes `requiredLevels?: Level[]`
    - `ISession` includes `requiredLevels?: Level[]`
    - Methods automatically handle the field through type inference

---

### Phase 5: UI/UX Implementation 🎨 ✅ COMPLETED

**Estimated Time: 60-90 minutes**

#### 5.1. GeneralSettings Component - Level Selector ✅

- [x] **File: `src/components/session/GeneralSettings.tsx`** ✅
  - ✅ Component dùng để edit session đã có UI chọn levels

- [x] **File: `src/app/[locale]/host/sessions/new/page.tsx`** ✅
  - ✅ Trang tạo session mới đã được thêm UI chọn requiredLevels
  - ✅ Thêm state `requiredLevels` (line 52)
  - ✅ Thêm handler `handleLevelToggle` (lines 187-195)
  - ✅ Thêm UI section với Shield icon và level badges (lines 250-299)
  - ✅ Cập nhật `createSession` để gửi `requiredLevels` (line 133)
  - ✅ **5.1.1. Import Dependencies** ✅
    - Added `Level` enum import from `@/lib/api/types`
    - Added `Badge`, `Wrap`, `WrapItem` from `@chakra-ui/react`
    - Added `Shield` icon from `lucide-react`

  - ✅ **5.1.2. Add State for requiredLevels** ✅
    - Added `requiredLevels: session.requiredLevels || []` to formData state (line 48)

  - ✅ **5.1.3. Create Level Toggle Handler** ✅
    - Implemented `handleLevelToggle` function (lines 69-80)
    - Handles adding/removing levels from selection

  - ✅ **5.1.4. Add UI Component** ✅
  - Add new section in form (after "Session Settings" section):

  ```tsx
  <VStack gap={4} align="stretch" mt={6}>
    <Heading size="sm" color="gray.700">
      <HStack>
        <Shield size={16} />
        <Text>Required Player Levels</Text>
      </HStack>
    </Heading>

    <Box p={4} bg="gray.50" borderRadius="lg">
      <Text fontSize="xs" color="gray.600" mb={3}>
        Select required levels for this session. Leave empty to allow all
        levels.
      </Text>

      <Wrap gap={2}>
        {Object.values(Level).map((level) => {
          const isSelected = formData.requiredLevels?.includes(level);
          return (
            <WrapItem key={level}>
              <Badge
                px={3}
                py={2}
                borderRadius="md"
                cursor="pointer"
                bg={isSelected ? 'blue.500' : 'gray.200'}
                color={isSelected ? 'white' : 'gray.700'}
                fontSize="sm"
                fontWeight="semibold"
                onClick={() => handleLevelToggle(level)}
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'sm',
                }}
                transition="all 0.2s"
              >
                {level.replace('_', ' ')}
              </Badge>
            </WrapItem>
          );
        })}
      </Wrap>

      {formData.requiredLevels?.length > 0 && (
        <Text fontSize="xs" color="blue.600" mt={2}>
          ✓ {formData.requiredLevels.length} level(s) selected
        </Text>
      )}
    </Box>
  </VStack>
  ```

#### 5.2. Session Info Display ✅

- [x] **Display requiredLevels in Session Details** ✅
  - ✅ Updated `src/components/session/SessionCard.tsx`:
    - Added Shield icon and requiredLevels badges display (lines 150-165)
    - Shows when session has requiredLevels
  - ✅ Updated `src/components/player/PlayerSessionCard.tsx`:
    - Added Shield icon and requiredLevels badges display (lines 150-165)
    - Consistent display with SessionCard
  - Display format:
    ```tsx
    {
      session.requiredLevels && session.requiredLevels.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Required Levels:
          </Text>
          <Wrap>
            {session.requiredLevels.map((level) => (
              <Badge key={level} colorScheme="blue">
                {level.replace('_', ' ')}
              </Badge>
            ))}
          </Wrap>
        </Box>
      );
    }
    ```

#### 5.3. Player Join Form - Level Validation Message ✅

- [x] **File: `src/app/[locale]/join/page.tsx`** ✅
  - ✅ Added requiredLevels display when session is selected (lines 252-278)
    - Shows orange info box with Shield icon
    - Lists all required levels as badges
  - ✅ Added level validation message for selected player (lines 335-380)
    - Green box if player level matches required levels
    - Yellow box if player has no level
    - Red box if player level doesn't match
  - ✅ Shows player level in player info preview (line 377)
  - Clear error messages with actionable feedback

#### 5.4. Session List/Card - Visual Indicator ✅

- [x] **Visual indicators added** ✅
  - ✅ Shield icon with "Required Levels:" label in SessionCard
  - ✅ Shield icon with "Required Levels:" label in PlayerSessionCard
  - ✅ Badges showing each required level
  - ✅ Consistent styling across all session cards

---

### Phase 6: Validation & Error Handling ⚠️ ✅ COMPLETED

**Estimated Time: 20-30 minutes**

#### 6.1. Backend Validation ✅

- [x] **Validation Rules:** ✅
  - ✅ `requiredLevels` must be an array of valid Level enum values
    - Added validation in `src/app/api/sessions/route.ts` (POST handler)
    - Added validation in `src/app/api/sessions/[id]/route.ts` (PUT handler)
  - ✅ If populated, can be empty (or allow empty = all levels)
  - ✅ Reject invalid level values with clear error messages

- [x] **Error Messages:** ✅
  - ✅ Player joins with invalid level (already implemented in Phase 3):
    ```
    "Your level ({playerLevel}) is not allowed in this session. Required levels: {requiredLevels.join(', ')}"
    ```
  - ✅ Player has no level but session requires one (already implemented in Phase 3):
    ```
    "This session requires players to have one of these levels: {requiredLevels.join(', ')}. Please provide your level."
    ```
  - ✅ Invalid level values in create/update:
    ```
    "Invalid level values: {invalidLevels}. Valid levels are: {validLevels}"
    ```

#### 6.2. Frontend Validation ✅

- [x] **Form Validation:** ✅
  - ✅ Show warning if all levels selected (in GeneralSettings)
    - Warning: "⚠️ All levels selected. Consider leaving empty to allow all levels."
  - ✅ Confirmation dialog when changing requiredLevels of an active session
    - Checks if session is active (has players or IN_PROGRESS status)
    - Shows confirmation dialog with current vs new levels
    - Warns about potential impact on existing players
  - ✅ Validate requiredLevels array before submission
    - Checks for invalid level values
    - Shows error toast with invalid values

---

### Phase 7: Testing 🧪

**Estimated Time: 30-45 minutes**

#### 7.1. Backend Tests

- [ ] Test create session with requiredLevels
- [ ] Test update session requiredLevels
- [ ] Test player join with valid level
- [ ] Test player join with invalid level (expect error)
- [ ] Test player join when requiredLevels = [] (all levels allowed)

#### 7.2. Frontend Tests

- [ ] Test UI renders correctly
- [ ] Test level selection/deselection
- [ ] Test form submit with requiredLevels
- [ ] Test error handling and display

#### 7.3. Integration Tests

- [ ] Test end-to-end flow: Create session → Set required levels → Player join
- [ ] Test update session levels when players have already joined
- [ ] Test edge cases (empty array, null, undefined)

---

### Phase 8: Documentation 📚 ✅ COMPLETED

**Estimated Time: 15-20 minutes**

- [x] **Update API Documentation** ✅
  - ✅ File: `docs/README-API.md`
  - ✅ Documented requiredLevels field in:
    - ✅ Create Session API - Added detailed endpoint documentation with request/response examples
    - ✅ Update Session API - Added update endpoint documentation
    - ✅ Player Join validation - Added validation rules and error messages
  - ✅ Added Level enum values reference
  - ✅ Updated Session model documentation

- [x] **Update Feature Documentation** ✅
  - ✅ Created `docs/REQUIRED_LEVELS_FEATURE.md`
  - ✅ Comprehensive usage guide for hosts and players
  - ✅ UI components documentation
  - ✅ Technical details and API examples
  - ✅ Error messages reference
  - ✅ Best practices and examples

- [x] **Code Comments** ✅
  - ✅ Validation logic comments in backend APIs
  - ✅ Helper functions documented
  - ✅ JSDoc comments in SessionService (Phase 4)

---

## 🎯 Recommended Implementation Order

### Step 1: Database & Types (30 mins)

1. Update Prisma schema
2. Run migration
3. Update TypeScript types

### Step 2: Backend (45 mins)

4. Update Create Session API
5. Update Update Session API
6. Add validation logic to Player Join APIs
7. Test APIs with Postman/Thunder Client

### Step 3: Frontend (90 mins)

8. Update SessionService
9. Update GeneralSettings UI
10. Add display components
11. Add validation messages

### Step 4: Testing & Polish (45 mins)

12. Manual testing
13. Fix bugs
14. Add documentation
15. Code review

---

## 📊 Total Estimated Time: 3.5 - 4.5 hours

---

## 🔍 Important Notes

### Security & Performance

1. **Validation**: Always validate on both backend and frontend
2. **Default value**: Empty array = allow all levels (no restriction)
3. **Migration**: Existing sessions will have requiredLevels = [] (allow all)

### UX Considerations

1. **Clear messaging**: Display required levels clearly to users
2. **Visual feedback**: Badge colors, icons for easy recognition
3. **Error handling**: Error messages must be helpful and actionable

### Edge Cases

1. Player has no level but session requires level
2. Update requiredLevels when session is active
3. Update user level when already joined session with restrictions
4. Bulk player creation with level validation

---

## 🚀 Post-Implementation

### Optional Enhancements (Future)

- [ ] Analytics: Track sessions by required levels
- [ ] Quick filters: Filter sessions by level requirements
- [ ] Auto-suggest levels based on current players
- [ ] Level range selector (e.g., Y to TB)
- [ ] Export/import session templates with requiredLevels

---

## 📝 Testing Checklist

### Scenarios to Test

- ✅ Create session without requiredLevels (should work, default [])
- ✅ Create session with 1 requiredLevel
- ✅ Create session with multiple requiredLevels
- ✅ Update session to add requiredLevels
- ✅ Update session to remove requiredLevels
- ✅ Player with valid level joins session
- ✅ Player with invalid level tries to join (should fail)
- ✅ Player without level tries to join restricted session (should fail)
- ✅ Guest player with level joins session
- ✅ Bulk player creation respects requiredLevels

---

## 🎨 UI/UX Mockup Description

### GeneralSettings - Required Levels Section

```
┌─────────────────────────────────────────────┐
│ 🛡️  Required Player Levels                 │
├─────────────────────────────────────────────┤
│ Select required levels for this session.   │
│ Leave empty to allow all levels.           │
│                                             │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐        │
│ │ Y- │ │ Y  │ │ Y+ │ │TBY │ │TB- │        │
│ └────┘ └────┘ └────┘ └────┘ └────┘        │
│ ┌────┐ ┌────┐ ┌────┐                      │
│ │ TB │ │TB+ │ │ K  │                      │
│ └────┘ └────┘ └────┘                      │
│                                             │
│ ✓ 3 level(s) selected                      │
└─────────────────────────────────────────────┘
```

### Session Card - Level Indicator

```
┌─────────────────────────────────────┐
│ Session Name                        │
│ 📍 Location  |  👥 12 players       │
│ 🛡️  Required: Y, Y+, TBY           │
└─────────────────────────────────────┘
```

---

## ✅ Ready to Start!

You can start from Phase 1 and work sequentially through this plan. Each phase can be done independently and tested separately before moving to the next phase.

**Recommendation**: Commit code after each phase for easy rollback if needed!
