# Bulk Session Creation API Documentation

## Overview

This document describes the backend API endpoint needed to support bulk session creation in the badminton frontend application.

## Endpoint

### POST `/api/sessions/bulk`

Creates multiple sessions at once based on the specified mode (single, specific dates, or recurring weekdays).

## Request Body

```typescript
{
  mode: 'single' | 'specific-dates' | 'recurring-weekdays';
  baseSession: CreateSessionRequest; // Same as existing POST /sessions
  specificDates?: {
    dates: Date[]; // Array of specific dates to clone the session to
  };
  recurringWeekdays?: {
    weekdays: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    numberOfWeeks: number; // Number of weeks to repeat (1-52)
    startDate?: Date; // Optional start date, defaults to baseSession.startTime
  };
}
```

## Response

```typescript
{
  success: boolean;
  sessionsCreated: number;
  sessions: ISession[]; // Array of all created sessions
  errors?: Array<{
    date: string;
    error: string;
  }>;
}
```

## Implementation Logic

### Mode: `single`

- Simply create one session using the `baseSession` data
- Return array with single session

### Mode: `specific-dates`

- Create the base session with its original `startTime` and `endTime`
- For each date in `specificDates.dates`:
  - Clone the base session data
  - Preserve the **time portion** (hours:minutes) from base session's startTime/endTime
  - Apply the **date portion** from the specific date
  - Create a new session with the combined date+time
- Example:
  - Base session: `2024-02-05 18:00 - 20:00`
  - Specific dates: `[2024-02-10, 2024-02-15, 2024-02-20]`
  - Results: 4 sessions total
    - `2024-02-05 18:00 - 20:00` (original)
    - `2024-02-10 18:00 - 20:00` (cloned)
    - `2024-02-15 18:00 - 20:00` (cloned)
    - `2024-02-20 18:00 - 20:00` (cloned)

### Mode: `recurring-weekdays`

- Create the base session with its original `startTime` and `endTime`
- Determine start date:
  - Use `recurringWeekdays.startDate` if provided
  - Otherwise use `baseSession.startTime` date
- For each week (1 to `numberOfWeeks`):
  - For each selected weekday in `weekdays`:
    - Calculate the date for that weekday in that week
    - Preserve the **time portion** from base session's startTime/endTime
    - Apply the **date portion** from the calculated date
    - Create a new session with the combined date+time
- **Important**: Skip creating a duplicate if the calculated date matches the base session's date
- Example:
  - Base session: `2024-02-05 (Monday) 18:00 - 20:00`
  - Weekdays: `[1, 3, 5]` (Monday, Wednesday, Friday)
  - Number of weeks: 4
  - Results: 12 sessions total (3 days/week × 4 weeks)
    - Week 1: Mon 2/5 18:00-20:00, Wed 2/7 18:00-20:00, Fri 2/9 18:00-20:00
    - Week 2: Mon 2/12 18:00-20:00, Wed 2/14 18:00-20:00, Fri 2/16 18:00-20:00
    - Week 3: Mon 2/19 18:00-20:00, Wed 2/21 18:00-20:00, Fri 2/23 18:00-20:00
    - Week 4: Mon 2/26 18:00-20:00, Wed 2/28 18:00-20:00, Fri 3/1 18:00-20:00

## Error Handling

### All-or-Nothing (Recommended)

- Use database transactions
- If ANY session creation fails, rollback ALL changes
- Return error response with details
- Ensures data consistency

```typescript
// Example error response
{
  success: false,
  sessionsCreated: 0,
  sessions: [],
  errors: [
    {
      date: '2024-02-15T18:00:00Z',
      error: 'Venue already booked at this time'
    }
  ]
}
```

## Validation Rules

1. **Mode validation**:
   - Must be one of: `single`, `specific-dates`, `recurring-weekdays`
   - If mode is `specific-dates`, `specificDates` config must be provided
   - If mode is `recurring-weekdays`, `recurringWeekdays` config must be provided

2. **Specific dates validation**:
   - Dates array must not be empty
   - All dates must be in the future (or allow same day based on business rules)
   - No duplicate dates

3. **Recurring weekdays validation**:
   - Weekdays array must not be empty
   - Weekdays must be 0-6
   - numberOfWeeks must be 1-52
   - No duplicate weekdays

4. **Base session validation**:
   - Same validation as regular POST /sessions endpoint
   - All required fields must be present

## Implementation Pseudo-code

```typescript
async function createBulkSessions(request: BulkSessionCreationRequest) {
  // Start transaction
  const transaction = await db.startTransaction();

  try {
    const sessions: ISession[] = [];

    if (request.mode === 'single') {
      const session = await createSession(request.baseSession, transaction);
      sessions.push(session);
    } else if (request.mode === 'specific-dates') {
      // Create base session first
      const baseSession = await createSession(request.baseSession, transaction);
      sessions.push(baseSession);

      // Clone to specific dates
      for (const date of request.specificDates.dates) {
        const clonedSession = cloneSessionWithNewDate(
          request.baseSession,
          date
        );
        const session = await createSession(clonedSession, transaction);
        sessions.push(session);
      }
    } else if (request.mode === 'recurring-weekdays') {
      // Create base session first
      const baseSession = await createSession(request.baseSession, transaction);
      sessions.push(baseSession);

      const startDate =
        request.recurringWeekdays.startDate || request.baseSession.startTime;

      // Calculate all dates
      const dates = calculateRecurringDates(
        startDate,
        request.recurringWeekdays.weekdays,
        request.recurringWeekdays.numberOfWeeks
      );

      // Filter out base session date to avoid duplicates
      const baseDateStr = formatDate(baseSession.startTime);
      const uniqueDates = dates.filter((d) => formatDate(d) !== baseDateStr);

      // Create sessions for each date
      for (const date of uniqueDates) {
        const clonedSession = cloneSessionWithNewDate(
          request.baseSession,
          date
        );
        const session = await createSession(clonedSession, transaction);
        sessions.push(session);
      }
    }

    // Commit transaction
    await transaction.commit();

    return {
      success: true,
      sessionsCreated: sessions.length,
      sessions,
    };
  } catch (error) {
    // Rollback transaction
    await transaction.rollback();

    return {
      success: false,
      sessionsCreated: 0,
      sessions: [],
      errors: [{ date: 'N/A', error: error.message }],
    };
  }
}

function cloneSessionWithNewDate(
  baseSession: CreateSessionRequest,
  newDate: Date
): CreateSessionRequest {
  // Preserve time from base session
  const startTime = new Date(baseSession.startTime);
  const endTime = new Date(baseSession.endTime);

  // Apply new date
  const newStartTime = new Date(newDate);
  newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

  const newEndTime = new Date(newDate);
  newEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

  return {
    ...baseSession,
    startTime: newStartTime,
    endTime: newEndTime,
  };
}

function calculateRecurringDates(
  startDate: Date,
  weekdays: number[],
  numberOfWeeks: number
): Date[] {
  const dates: Date[] = [];

  for (let week = 0; week < numberOfWeeks; week++) {
    for (const weekday of weekdays) {
      const date = new Date(startDate);

      // Calculate days to add
      const currentWeekday = startDate.getDay();
      let daysToAdd = (weekday - currentWeekday + 7) % 7;
      daysToAdd += week * 7;

      date.setDate(startDate.getDate() + daysToAdd);
      dates.push(date);
    }
  }

  return dates;
}
```

## Testing

### Test Case 1: Single Mode

```bash
POST /api/sessions/bulk
{
  "mode": "single",
  "baseSession": { /* regular session data */ }
}

Expected: 1 session created
```

### Test Case 2: Specific Dates

```bash
POST /api/sessions/bulk
{
  "mode": "specific-dates",
  "baseSession": {
    "name": "Weekly Game",
    "startTime": "2024-02-05T18:00:00Z",
    "endTime": "2024-02-05T20:00:00Z",
    /* ... other fields */
  },
  "specificDates": {
    "dates": [
      "2024-02-12T00:00:00Z",
      "2024-02-19T00:00:00Z",
      "2024-02-26T00:00:00Z"
    ]
  }
}

Expected: 4 sessions created (base + 3 clones)
- 2024-02-05 18:00-20:00
- 2024-02-12 18:00-20:00
- 2024-02-19 18:00-20:00
- 2024-02-26 18:00-20:00
```

### Test Case 3: Recurring Weekdays

```bash
POST /api/sessions/bulk
{
  "mode": "recurring-weekdays",
  "baseSession": {
    "name": "MWF Sessions",
    "startTime": "2024-02-05T18:00:00Z",
    "endTime": "2024-02-05T20:00:00Z",
    /* ... other fields */
  },
  "recurringWeekdays": {
    "weekdays": [1, 3, 5],
    "numberOfWeeks": 2
  }
}

Expected: 6 sessions created
Week 1: Mon 2/5, Wed 2/7, Fri 2/9
Week 2: Mon 2/12, Wed 2/14, Fri 2/16
All from 18:00-20:00
```

### Test Case 4: Error Handling (Rollback)

- Create bulk request with 5 sessions
- Force failure on 3rd session (e.g., invalid venue)
- Expected: ALL sessions rolled back, 0 sessions created

## Database Schema Considerations

No changes to existing schema needed - the same `sessions` table is used. Each session is created independently with its own record.

## Performance Considerations

- Bulk creation with 100+ sessions may take time
- Consider implementing:
  - Request timeout handling (increase timeout for bulk requests)
  - Progress notifications (WebSocket/SSE)
  - Async job processing for large batches (queue system)
  - Rate limiting per user

## Security Considerations

- Enforce user authentication (same as single session creation)
- Rate limiting: Limit number of sessions created per request (e.g., max 100)
- Validate user owns/can create at specified venue
- Prevent spam by limiting requests per time period

## Future Enhancements

1. **Batch Operations**: Allow updating/deleting multiple sessions by bulk ID
2. **Templates**: Save bulk creation configs as templates
3. **Preview Mode**: Return calculated dates without creating sessions
4. **Partial Success**: Option for "best effort" mode instead of all-or-nothing
