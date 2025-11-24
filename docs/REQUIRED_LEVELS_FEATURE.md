# Required Levels Feature

## Overview

The Required Levels feature allows session hosts to restrict which player levels can join a session. This helps organize sessions by skill level, ensuring players are matched appropriately.

## How It Works

### Basic Concept

- **Empty `requiredLevels`** (default): All player levels are allowed to join
- **Populated `requiredLevels`**: Only players with levels in this list can join

### Available Levels

The system supports the following player levels:

- `Y_MINUS` - Y-
- `Y` - Y
- `Y_PLUS` - Y+
- `TBY` - TBY
- `TB_MINUS` - TB-
- `TB` - TB
- `TB_PLUS` - TB+
- `K` - K

## Usage Guide

### For Hosts

#### Creating a Session with Required Levels

1. **Navigate to Create Session page** (`/host/sessions/new`)

2. **Fill in session details** (name, time, courts, etc.)

3. **Select Required Levels**:
   - Find the "Required Player Levels" section
   - Click on level badges to select/deselect levels
   - Selected levels will be highlighted in blue
   - Leave empty to allow all levels

4. **Create Session**:
   - Click "Create Session" button
   - Session will be created with the selected level restrictions

#### Updating Required Levels

1. **Navigate to Session Settings** (`/host/sessions/[id]` → Settings tab)

2. **Find "Required Player Levels" section**

3. **Modify levels**:
   - Click badges to add/remove levels
   - Changes are saved when you click "Update Session"

4. **Confirmation Dialog**:
   - If session is active (has players or is IN_PROGRESS), a confirmation dialog will appear
   - Review the changes (current vs new levels)
   - Confirm or cancel the update

#### Best Practices

- **Leave empty for open sessions**: If you want all skill levels to join, leave `requiredLevels` empty
- **Be specific for skill-based sessions**: Select only the levels you want for targeted skill groups
- **Consider existing players**: When updating levels on an active session, consider how it affects current players
- **Warning for all levels**: If you select all 8 levels, the system will warn you - consider leaving empty instead

### For Players

#### Joining a Session with Required Levels

1. **Select Session**:
   - When joining, you'll see a notification if the session has required levels
   - The notification shows which levels are allowed

2. **Level Validation**:
   - **Green box**: Your level matches the requirements ✅
   - **Yellow box**: You don't have a level set - update your profile ⚠️
   - **Red box**: Your level doesn't match - you cannot join ❌

3. **If Your Level Doesn't Match**:
   - Update your profile level to match session requirements
   - Or contact the host to request access

## UI Components

### Session Creation/Edit Form

**Location**: `src/components/session/GeneralSettings.tsx` and `src/app/[locale]/host/sessions/new/page.tsx`

**Features**:
- Visual level selector with badges
- Click to toggle levels on/off
- Shows count of selected levels
- Warning when all levels are selected

### Session Cards

**Location**: `src/components/session/SessionCard.tsx` and `src/components/player/PlayerSessionCard.tsx`

**Features**:
- Shield icon indicator when session has required levels
- Badges showing each required level
- Clear visual indication of restrictions

### Player Join Form

**Location**: `src/app/[locale]/join/page.tsx`

**Features**:
- Shows required levels when session is selected
- Real-time validation of player level
- Color-coded feedback (green/yellow/red)
- Clear error messages

### Player Management

**Location**: `src/components/session/PlayerManagement.tsx`

**Features**:
- Level dropdown only shows allowed levels
- If session has required levels, only those levels appear
- If session allows all levels, all levels appear

## Technical Details

### Database Schema

```prisma
model Session {
  // ... other fields
  requiredLevels     Level[]       @default([])
  // ... other fields
}
```

### API Endpoints

#### Create Session
```
POST /api/sessions
Body: {
  "requiredLevels": ["Y", "Y_PLUS", "TBY"]
}
```

#### Update Session
```
PUT /api/sessions/:id
Body: {
  "requiredLevels": ["TB", "TB_PLUS", "K"]
}
```

#### Player Join Validation
```
POST /api/sessions/:id/players
Body: {
  "level": "Y_PLUS"
}
```

If player level doesn't match `requiredLevels`, returns 400 error.

### Validation Rules

1. **Backend Validation**:
   - `requiredLevels` must be an array
   - Each level must be a valid Level enum value
   - Empty array is allowed (means all levels)

2. **Frontend Validation**:
   - Validates level values before submission
   - Shows confirmation dialog for active sessions
   - Warns if all levels are selected

3. **Player Join Validation**:
   - Checks if session has required levels
   - Validates player has a level (if required)
   - Validates player level is in allowed list

## Error Messages

### Backend Errors

- `"requiredLevels must be an array"` - Invalid type
- `"Invalid level values: X, Y. Valid levels are: ..."` - Invalid level values
- `"This session requires players to have one of these levels: ... Please provide your level."` - Player has no level
- `"Your level (X) is not allowed in this session. Required levels: ..."` - Player level doesn't match

### Frontend Warnings

- `"⚠️ All levels selected. Consider leaving empty to allow all levels."` - All levels selected
- Confirmation dialog when changing levels on active session

## Examples

### Example 1: Open Session (All Levels Allowed)

```json
{
  "name": "Open Session",
  "requiredLevels": []
}
```

Result: All players can join regardless of level.

### Example 2: Beginner Session

```json
{
  "name": "Beginner Session",
  "requiredLevels": ["Y_MINUS", "Y", "Y_PLUS"]
}
```

Result: Only beginner players (Y-, Y, Y+) can join.

### Example 3: Advanced Session

```json
{
  "name": "Advanced Session",
  "requiredLevels": ["TB", "TB_PLUS", "K"]
}
```

Result: Only advanced players (TB, TB+, K) can join.

## Migration Notes

- Existing sessions will have `requiredLevels = []` (all levels allowed)
- No action needed for existing sessions
- Feature is backward compatible

## Future Enhancements

Potential improvements:
- Level range selector (e.g., "Y to TBY")
- Auto-suggest levels based on current players
- Analytics: Track sessions by required levels
- Quick filters: Filter sessions by level requirements
- Export/import session templates with requiredLevels

