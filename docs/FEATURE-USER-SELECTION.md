# Feature: User Selection for Player Creation

## Overview

This feature allows hosts to select existing players from the User table when creating new players in a session. When a user is selected, their information is automatically filled into the form and the userId is linked to the player.

## Changes Made

### 1. API Endpoint - Get Users

**File**: `src/app/api/users/route.ts` (New)

New endpoint to fetch list of users:

- **Method**: GET
- **Path**: `/api/users`
- **Authentication**: Required
- **Response**: List of users with PLAYER role

```typescript
[
  {
    id: string,
    name: string,
    email: string,
    gender?: string,
    level?: string,
    levelDescription?: string
  }
]
```

### 2. User Service

**File**: `src/lib/api/user.service.ts` (New)

Service to call users API:

- `getAllUsers()`: Fetch all users

### 3. Updated Types

**File**: `src/lib/api/types.ts`

Added `userId` to `BulkPlayerData`:

```typescript
export interface BulkPlayerData {
  // ... existing fields
  userId?: string; // Optional userId to link with existing user
}
```

### 4. Updated Bulk Player API

**File**: `src/app/api/sessions/[id]/players/bulk/route.ts`

- Added `userId` to `BulkPlayerData` interface
- When creating a player with `userId`:
  - Link player to user
  - Mark `isJoined = true`
  - Mark `isGuest = false`

### 5. Updated PlayerManagement Component

**File**: `src/components/session/PlayerManagement.tsx`

**New State**:

- `availableUsers`: List of selectable users
- `isLoadingUsers`: Loading state for users

**New Functions**:

- `handleUserSelection(index, userId)`: Handle user selection from dropdown
  - Auto-fill information: name, gender, level, levelDescription
  - Save userId to player data
  - **Validate user is not already selected in other players**
  - **Show error toast if user is already selected**
- `isUserAlreadyUsed(userId, currentIndex?)`: Check if a user is already selected
  - Check in new players being created
  - Check in existing players in session
  - Used to disable options in dropdown

**UI Changes**:

- Added "Select Existing Player (Optional)" dropdown before "Player Name" field
- Dropdown displays users in format: `{name} ({email})`
- When user is selected, fields are automatically filled
- **All fields are disabled when a user is selected (except "Require player to confirm information" and the user dropdown itself)**
- **Users already selected in other players are disabled with "- Already selected" label**
- **Visual indication (gray color, italic) for disabled user options**
- Option "-- Create new player --" to create player without linking to user

## User Flow

### Creating player from existing user:

1. Host clicks "Add Player" button
2. New form appears with "Select Existing Player" dropdown
3. Host selects a user from dropdown
   - **Users already selected are disabled and marked as "Already selected"**
4. Fields (Name, Gender, Level, Level Description) are automatically filled **and disabled**
5. Host can only modify "Require player to confirm information" checkbox
6. To change player information, host must select "-- Create new player --" again
7. Click "Save All" to create player

### Validation:

- **Cannot select the same user for multiple players**
- **System checks both new players being added and existing players in session**
- **Error toast appears if attempting to select already-used user**
- **Dropdown options are disabled for already-selected users**

### Creating new player without linking user:

1. Host clicks "Add Player" button
2. Keep dropdown at "-- Create new player --" option
3. Fill in player information manually
4. Click "Save All" to create player

## Database Impact

When player is created with userId:

- `userId`: ID of selected user
- `isJoined`: true (player slot has been filled)
- `isGuest`: false (not a guest)
- `preFilledByHost`: true
- `confirmedByPlayer`: false

## Benefits

1. **Faster Player Creation**: No need to re-enter information for existing users
2. **Data Consistency**: Player information is synchronized from user profile and cannot be modified
3. **Data Integrity**: Prevents accidental modification of user information when creating players
4. **No Duplicate Users**: Validation prevents selecting the same user multiple times
5. **Clear Visual Feedback**: Disabled options show which users are already selected
6. **User Tracking**: Host can track who participated in sessions
7. **Flexibility**: Still able to create new players or guest players

## Implementation Details

### Disabled Fields Logic

When a user is selected from the dropdown (`player.userId` is set):

- **Player Name** input: `disabled={!!player.userId}`
- **Gender** select: `disabled={!!player.userId}`
- **Level** select: `disabled={!!player.userId}`
- **Level Description** textarea: `disabled={!!player.userId}`
- Visual feedback: Reduced opacity (0.6) and changed cursor to `not-allowed`
- Background color changed to gray for better visual indication

Fields that remain **enabled**:

- **Select Existing Player** dropdown (to allow changing selection)
- **Require player to confirm information** checkbox (session-specific setting)

### User Selection Validation

To prevent duplicate user selection:

- `isUserAlreadyUsed(userId, currentIndex?)` checks:
  - All new players being created (excluding current player being edited)
  - All existing players in the session
- When user attempts to select an already-used user:
  - Error toast notification appears
  - Selection is not applied
  - Form remains unchanged
- Dropdown prevention:
  - Already-selected users are disabled in dropdown
  - Disabled options show "- Already selected" suffix
  - Visual styling (gray color, italic) indicates unavailable users

## Testing

### Test Cases:

1. ✅ Load users list when component mounts
2. ✅ Select user from dropdown auto-fills information
3. ✅ **Fields are disabled when user is selected**
4. ✅ **"Require player to confirm information" checkbox remains enabled**
5. ✅ Select "Create new player" clears form and re-enables all fields
6. ✅ Save player with userId links correctly
7. ✅ Save player without userId creates independent player
8. ✅ **Disabled fields have proper visual feedback (opacity, cursor, background color)**
9. ✅ **Cannot select the same user twice in new players**
10. ✅ **Cannot select a user that already exists in session**
11. ✅ **Error toast displays when attempting to select duplicate user**
12. ✅ **Dropdown options are disabled for already-selected users**
13. ✅ **Disabled options show "- Already selected" label**

## Future Enhancements

1. Search/Filter users in dropdown
2. Display user avatar
3. Display statistics (participation count, win rate) for users
4. Suggest users based on participation history
5. Bulk import from user list
