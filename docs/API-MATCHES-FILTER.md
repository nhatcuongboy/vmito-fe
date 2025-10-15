# API Documentation: GET /api/sessions/[id]/matches

## Overview

Lấy danh sách matches của một session với khả năng filter theo player hoặc court.

## Endpoint

```
GET /api/sessions/[id]/matches
```

## Query Parameters (Optional)

| Parameter | Type   | Description                 | Example    |
| --------- | ------ | --------------------------- | ---------- |
| playerId  | string | Filter matches by player ID | `cm123abc` |
| courtId   | string | Filter matches by court ID  | `cm456def` |

## Examples

### 1. Get all matches (no filter)

```bash
curl -X GET "http://localhost:3000/api/sessions/cm789xyz/matches" \
  -H "Accept: application/json"
```

### 2. Filter by player ID

```bash
curl -X GET "http://localhost:3000/api/sessions/cm789xyz/matches?playerId=cm123abc" \
  -H "Accept: application/json"
```

### 3. Filter by court ID

```bash
curl -X GET "http://localhost:3000/api/sessions/cm789xyz/matches?courtId=cm456def" \
  -H "Accept: application/json"
```

### 4. Filter by both player and court

```bash
curl -X GET "http://localhost:3000/api/sessions/cm789xyz/matches?playerId=cm123abc&courtId=cm456def" \
  -H "Accept: application/json"
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match123",
        "sessionId": "session123",
        "courtId": "court123",
        "status": "FINISHED",
        "startTime": "2025-07-31T10:00:00Z",
        "endTime": "2025-07-31T10:30:00Z",
        "score": [21, 19],
        "winnerIds": ["player1", "player2"],
        "isDraw": false,
        "notes": "Great match!",
        "players": [
          {
            "id": "mp1",
            "matchId": "match123",
            "playerId": "player1",
            "position": 1,
            "player": {
              "id": "player1",
              "name": "John Doe",
              "level": "TB"
            }
          }
        ],
        "court": {
          "id": "court123",
          "courtNumber": 1,
          "courtName": "Court A"
        }
      }
    ],
    "totalMatches": 1,
    "filters": {
      "playerId": "cm123abc",
      "courtId": null
    }
  },
  "message": "Matches retrieved successfully (filtered by player ID: cm123abc)"
}
```

### Error Response (404)

```json
{
  "success": false,
  "error": "Session not found"
}
```

## Usage in Frontend

### Using SessionService (existing method)

```typescript
// Get all matches
const matches = await SessionService.getSessionMatches(sessionId);
```

### Using new filtered method

```typescript
// Get matches filtered by player
const result = await SessionService.getSessionMatchesWithFilters(sessionId, {
  playerId: 'cm123abc',
});

// Get matches filtered by court
const result = await SessionService.getSessionMatchesWithFilters(sessionId, {
  courtId: 'cm456def',
});

// Get matches filtered by both
const result = await SessionService.getSessionMatchesWithFilters(sessionId, {
  playerId: 'cm123abc',
  courtId: 'cm456def',
});

// Access the data
console.log(`Found ${result.totalMatches} matches`);
console.log('Applied filters:', result.filters);
result.matches.forEach((match) => {
  console.log(`Match ${match.id}: ${match.status}`);
});
```

## Notes

- Nếu không truyền filter parameters, API sẽ trả về tất cả matches của session
- Filters có thể combine với nhau (playerId + courtId)
- Response bao gồm thông tin về filters đã được áp dụng
- Matches được sắp xếp theo startTime descending (mới nhất trước)
- Score và winnerIds được parse từ JSON string format
