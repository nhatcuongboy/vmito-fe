# Badminton Session Management API

## Phase 1 (Core) + Phase 2 (Management) Implementation

This is the API documentation for the badminton session management system with comprehensive real-time management features.

## API Endpoints

### Session Management

- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/sessions/:id/start` - Start a session
- `POST /api/sessions/:id/end` - End a session
- `GET /api/sessions/:id/status` - Get real-time session status with comprehensive statistics
- `POST /api/sessions/:id/auto-assign` - Auto-assign waiting players to available courts

### Player Management

- `GET /api/sessions/:id/players` - Get players in a session
- `POST /api/sessions/:id/players` - Create a new player in a session
- `POST /api/sessions/:id/players/bulk` - Create multiple players at once
- `GET /api/players/:id` - Get player details
- `PUT /api/players/:id` - Update player details
- `DELETE /api/players/:id` - Remove a player
- `POST /api/players/:id/confirm` - Player confirms participation
- `GET /api/sessions/:id/waiting-queue` - Get waiting players sorted by wait time
- `PUT /api/players/update-wait-times` - Update wait times for waiting players
- `PUT /api/sessions/:id/wait-times` - Update or reset wait times for all players in session

### Court Management

- `GET /api/sessions/:id/courts` - Get courts in a session
- `POST /api/courts/:id/select-players` - Select players for a court
- `POST /api/courts/:id/start-match` - Start a match on a court
- `POST /api/courts/:id/end-match` - End a match on a court
- `GET /api/courts/:id/current-match` - Get current match details

### Match Management

- `GET /api/sessions/:id/matches` - Get all matches in a session (active and finished)
- `POST /api/sessions/:id/matches/:matchId/end` - End a specific match by ID

## Models

### Session

- Buổi chơi cầu lông với cấu hình số sân, thời gian, etc.
- **Status**: `PREPARING`, `IN_PROGRESS`, `FINISHED`
- **Real-time tracking**: Player counts, match statistics, wait times
- **Auto-assignment**: Intelligent player distribution to courts

### Player

- Người chơi trong buổi với số hiệu, thông tin cá nhân và thống kê
- **Status**: `WAITING`, `PLAYING`, `CONFIRMED`
- **Statistics**: `matchesPlayed`, `totalWaitTime`, `currentWaitTime`
- **Queue position**: Real-time position in waiting queue

### Court

- Sân chơi với trạng thái và danh sách người chơi hiện tại
- **Status**: `EMPTY`, `IN_USE`
- **Current match**: Active match information and duration
- **Auto-assignment**: Automatic player allocation when available

### Match

- Trận đấu với thời gian bắt đầu/kết thúc và người chơi tham gia
- **Status**: `IN_PROGRESS`, `FINISHED`
- **Duration tracking**: Real-time match duration calculation
- **Player positions**: 4 players per match with defined positions

## Key Features

### Phase 1 (Core)

- Basic session and player management
- Court assignment and match tracking
- Simple waiting queue

### Phase 2 (Management)

- **Real-time Status**: Comprehensive session monitoring
- **Auto-assignment**: Intelligent player distribution
- **Wait Time Management**: Automatic tracking and manual reset
- **Match History**: Complete match tracking and statistics
- **Queue Management**: Real-time waiting queue with positions
- **Performance Analytics**: Player and session statistics

### Technical Implementation

- **Next.js 15**: Modern App Router with proper async handling
- **Prisma**: Type-safe database operations
- **Real-time Updates**: Live session status and statistics
- **Responsive UI**: Mobile-friendly management interface

## Usage Flow

### Host Management Flow

1. **Session Creation**
   - Host creates a session with courts and player limits
   - Configure session duration, player requirements, etc.

2. **Player Registration**
   - Host adds players manually or players join with numbers
   - Players fill in personal info (if required by session)
   - Players confirm participation

3. **Session Start**
   - Host starts the session
   - System begins tracking wait times automatically

4. **Match Management**
   - Host uses auto-assign to distribute players to courts
   - Or manually select players for each court
   - Start matches on courts
   - Monitor real-time session status

5. **Ongoing Management**
   - End matches when complete
   - Players return to waiting queue with updated wait times
   - Use auto-assign for next round or manual selection
   - Monitor player statistics and wait times

6. **Session End**
   - End session to get final statistics
   - View player performance and wait time summaries

### Real-time Features

- **Live Session Status**: Get comprehensive session statistics
- **Wait Time Tracking**: Automatic calculation and manual reset options
- **Queue Management**: Real-time waiting queue with positions
- **Match Monitoring**: Track active matches and durations
- **Court Status**: Monitor court availability and usage

### Player Experience Flow

1. **Join Session**
   - Enter player number provided by host
   - Fill in personal information (if required)
   - Confirm participation

2. **Wait and Play**
   - Join waiting queue
   - Get assigned to courts by host
   - Play matches and return to queue
   - Track personal statistics

3. **Status Monitoring**
   - View current queue position
   - See wait time and match history
   - Get updates on session progress

## Authentication Flow

For casual players:

1. Enter player number
2. Fill in personal info (if required by session)
3. Join the session

For hosts:

- Full account with email/password
- Create and manage sessions

## Detailed API Documentation

### Create Session Endpoint

#### `POST /api/sessions`

Create a new badminton session with optional level requirements.

**Request Body:**

```json
{
  "name": "Friday Evening Session",
  "numberOfCourts": 2,
  "sessionDuration": 120,
  "maxPlayersPerCourt": 8,
  "requirePlayerInfo": true,
  "allowGuestJoin": true,
  "requiredLevels": ["Y", "Y_PLUS", "TBY"],
  "startTime": "2025-07-04T18:00:00.000Z",
  "endTime": "2025-07-04T20:00:00.000Z",
  "courts": [
    {
      "courtNumber": 1,
      "courtName": "Court A",
      "direction": "HORIZONTAL"
    }
  ]
}
```

**Request Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Session name |
| `numberOfCourts` | number | No | Number of courts (default: 2) |
| `sessionDuration` | number | No | Duration in minutes (default: 120) |
| `maxPlayersPerCourt` | number | No | Max players per court (default: 8) |
| `requirePlayerInfo` | boolean | No | Require player information (default: true) |
| `allowGuestJoin` | boolean | No | Allow guest players (default: true) |
| `requiredLevels` | Level[] | No | Array of required player levels. Empty array or undefined = all levels allowed |
| `startTime` | string (ISO) | No | Session start time |
| `endTime` | string (ISO) | No | Session end time |
| `courts` | CourtConfig[] | No | Custom court configuration |

**Level Enum Values:**

- `Y_MINUS` - Y-
- `Y` - Y
- `Y_PLUS` - Y+
- `TBY` - TBY
- `TB_MINUS` - TB-
- `TB` - TB
- `TB_PLUS` - TB+
- `K` - K

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "id": "cmcoksz69000p0q2j0w6mm3tr",
    "name": "Friday Evening Session",
    "status": "PREPARING",
    "numberOfCourts": 2,
    "maxPlayersPerCourt": 8,
    "requiredLevels": ["Y", "Y_PLUS", "TBY"],
    "startTime": "2025-07-04T18:00:00.000Z",
    "endTime": "2025-07-04T20:00:00.000Z",
    "courts": [...],
    "host": {...}
  },
  "message": "Session created successfully"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "error": "Invalid level values: INVALID_LEVEL. Valid levels are: Y_MINUS, Y, Y_PLUS, TBY, TB_MINUS, TB, TB_PLUS, K"
}
```

**Notes:**

- If `requiredLevels` is empty array `[]` or not provided, all levels are allowed
- If `requiredLevels` is provided, only players with levels in this list can join
- Invalid level values will be rejected with a clear error message

### Update Session Endpoint

#### `PUT /api/sessions/:id`

Update an existing session, including required levels.

**Request Body:**

```json
{
  "name": "Updated Session Name",
  "requiredLevels": ["TB", "TB_PLUS", "K"],
  "maxPlayersPerCourt": 6
}
```

**Request Fields:**

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Session name |
| `requiredLevels` | Level[] | Array of required player levels. Empty array = all levels allowed |
| `numberOfCourts` | number | Number of courts |
| `maxPlayersPerCourt` | number | Max players per court |
| `sessionDuration` | number | Duration in minutes |
| `requirePlayerInfo` | boolean | Require player information |
| `allowGuestJoin` | boolean | Allow guest players |
| `allowNewPlayers` | boolean | Allow new players to join |
| `startTime` | string (ISO) | Session start time |
| `endTime` | string (ISO) | Session end time |

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "id": "cmcoksz69000p0q2j0w6mm3tr",
    "name": "Updated Session Name",
    "requiredLevels": ["TB", "TB_PLUS", "K"],
    ...
  },
  "message": "Session updated successfully"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "error": "requiredLevels must be an array"
}
```

**Notes:**

- Changing `requiredLevels` on an active session may affect existing players
- Frontend should show confirmation dialog when changing levels on active sessions
- Empty array `[]` means all levels are allowed

### Player Join Validation

#### `POST /api/sessions/:id/players`

Create a new player in a session. The player's level will be validated against the session's `requiredLevels`.

**Request Body:**

```json
{
  "playerNumber": 1,
  "name": "John Doe",
  "gender": "MALE",
  "level": "Y_PLUS",
  "phone": "1234567890",
  "preFilledByHost": false,
  "requireConfirmInfo": true
}
```

**Level Validation:**

If the session has `requiredLevels` set:

1. **Player must have a level:**
   - If player has no level, returns error: `"This session requires players to have one of these levels: Y, Y_PLUS, TBY. Please provide your level."`

2. **Player level must be in requiredLevels:**
   - If player's level is not in the required list, returns error: `"Your level (TB) is not allowed in this session. Required levels: Y, Y_PLUS, TBY"`

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "id": "player123",
    "playerNumber": 1,
    "name": "John Doe",
    "level": "Y_PLUS",
    "sessionId": "session123",
    ...
  },
  "message": "Player created successfully"
}
```

**Response Error (400) - No Level:**

```json
{
  "success": false,
  "error": "This session requires players to have one of these levels: Y, Y_PLUS, TBY. Please provide your level."
}
```

**Response Error (400) - Invalid Level:**

```json
{
  "success": false,
  "error": "Your level (TB) is not allowed in this session. Required levels: Y, Y_PLUS, TBY"
}
```

**Notes:**

- Validation only applies if session has `requiredLevels` set (non-empty array)
- If `requiredLevels` is empty or undefined, all levels are allowed
- Bulk player creation also validates levels for each player

### Session End Endpoint

#### `POST /api/sessions/:id/end`

Kết thúc một session và trả về thống kê cuối cùng.

**Request:**

```
POST /api/sessions/cmcoksz69000p0q2j0w6mm3tr/end
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "cmcoksz69000p0q2j0w6mm3tr",
      "name": "Friday Session",
      "status": "FINISHED",
      "startTime": "2025-07-04T09:16:22.539Z",
      "endTime": "2025-07-04T10:52:00.000Z",
      "numberOfCourts": 2,
      "maxPlayersPerCourt": 8
    },
    "statistics": {
      "players": [
        {
          "id": "player1",
          "playerNumber": 1,
          "name": "John Doe",
          "matchesPlayed": 3,
          "totalWaitTime": 45
        }
      ]
    }
  },
  "message": "Session ended successfully"
}
```

**Response Error (404):**

```json
{
  "success": false,
  "error": "Session not found"
}
```

**Response Error (400):**

```json
{
  "success": false,
  "error": "Only in-progress sessions can be ended"
}
```

### Session Status Endpoint

#### `GET /api/sessions/:id/status`

Lấy trạng thái real-time của session với thống kê chi tiết.

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "cmcoksz69000p0q2j0w6mm3tr",
      "name": "Friday Session",
      "status": "IN_PROGRESS",
      "numberOfCourts": 2,
      "maxPlayersPerCourt": 8,
      "startTime": "2025-07-04T09:16:22.539Z",
      "endTime": "2025-07-04T10:52:00.000Z",
      "host": {
        "id": "host1",
        "name": "Host Name",
        "email": "host@example.com"
      }
    },
    "stats": {
      "totalPlayers": 8,
      "confirmedPlayers": 6,
      "waitingPlayers": 2,
      "playingPlayers": 4,
      "availableCourts": 1,
      "activeCourts": 1,
      "activeMatches": 1
    },
    "waitStats": {
      "averageWaitTime": 15,
      "maxWaitTime": 30,
      "minWaitTime": 5
    },
    "waitingQueue": [
      {
        "id": "player1",
        "playerNumber": 1,
        "name": "John Doe",
        "gender": "MALE",
        "level": "INTERMEDIATE",
        "currentWaitTime": 15,
        "totalWaitTime": 45,
        "matchesPlayed": 2,
        "queuePosition": 1
      }
    ],
    "activeMatches": [
      {
        "matchId": "match1",
        "courtNumber": 1,
        "startTime": "2025-07-04T09:33:05.493Z",
        "duration": 28,
        "players": [
          {
            "playerId": "player2",
            "playerNumber": 2,
            "name": "Jane Smith",
            "position": 1
          }
        ]
      }
    ],
    "courts": [
      {
        "id": "court1",
        "courtNumber": 1,
        "status": "IN_USE",
        "currentMatch": {
          "id": "match1",
          "startTime": "2025-07-04T09:33:05.493Z",
          "duration": 28,
          "playerCount": 4
        }
      }
    ],
    "lastUpdated": "2025-07-04T10:01:13.235Z"
  }
}
```

### Auto-Assign Endpoint

#### `POST /api/sessions/:id/auto-assign`

Tự động phân bổ người chơi đang chờ vào các sân trống.

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "assignedPlayers": [
      {
        "playerId": "player1",
        "courtId": "court1",
        "playerNumber": 1,
        "name": "John Doe"
      }
    ],
    "newMatches": [
      {
        "matchId": "match2",
        "courtId": "court1",
        "players": ["player1", "player2", "player3", "player4"]
      }
    ]
  },
  "message": "Players assigned successfully"
}
```

### Wait Times Management

#### `PUT /api/sessions/:id/wait-times`

Cập nhật hoặc reset thời gian chờ cho tất cả người chơi trong session.

**Request Body:**

```json
{
  "action": "reset"
}
```

**Response Success (200):**

```json
{
  "success": true,
  "data": {
    "updatedPlayers": 5,
    "action": "reset"
  },
  "message": "Wait times reset successfully"
}
```

## Testing & Development

### API Testing

All endpoints can be tested using curl or any HTTP client:

```bash
# Get session status
curl -X GET "http://localhost:3000/api/sessions/[sessionId]/status"

# End a session
curl -X POST "http://localhost:3000/api/sessions/[sessionId]/end"

# Auto-assign players
curl -X POST "http://localhost:3000/api/sessions/[sessionId]/auto-assign"

# Reset wait times
curl -X PUT "http://localhost:3000/api/sessions/[sessionId]/wait-times" \
  -H "Content-Type: application/json" \
  -d '{"action": "reset"}'
```

### Development Setup

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Seed test data
node seed-test-data.js

# Start development server
pnpm dev
```

### Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Database Schema

The application uses Prisma with the following key relationships:

- **Session** → **Player** (1:many)
- **Session** → **Court** (1:many)
- **Session** → **Match** (1:many)
- **Court** → **Match** (1:many)
- **Match** → **MatchPlayer** (1:many)
- **Player** → **MatchPlayer** (1:many)

### Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error
