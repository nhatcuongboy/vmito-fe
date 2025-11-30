# Standings Calculation

Utility functions for calculating tournament group standings based on match results.

## Overview

Standings calculation determines team rankings based on:
1. **Points** (primary): Win = 2, Draw = 1, Loss = 0
2. **Head-to-head** (tie-breaker): Direct match results between tied teams
3. **Point difference** (tie-breaker): Total points scored minus points conceded
4. **Points for** (tie-breaker): Total points scored

## Functions

### `calculateStandings(teamIds, matches, options)`

Calculate standings from match results.

**Parameters:**
- `teamIds`: Array of team/registration IDs
- `matches`: Array of finished match results
- `options`: 
  - `pointsForWin?: number` (default: 2)
  - `pointsForDraw?: number` (default: 1)
  - `pointsForLoss?: number` (default: 0)
  - `useHeadToHead?: boolean` (default: true)
  - `usePointDifference?: boolean` (default: true)

**Returns:**
```typescript
TeamStanding[] // Sorted by rank
```

**Example:**
```typescript
import { calculateStandings } from '@/utils/standings';

const teamIds = ['team1', 'team2', 'team3', 'team4'];
const matches = [
  {
    id: 'm1',
    participant1Id: 'team1',
    participant2Id: 'team2',
    participant1Score: 21,
    participant2Score: 19,
    winnerId: 'team1',
  },
  // ... more matches
];

const standings = calculateStandings(teamIds, matches);

// Result:
// [
//   {
//     teamId: 'team1',
//     matchesPlayed: 3,
//     matchesWon: 3,
//     matchesLost: 0,
//     matchesDrawn: 0,
//     points: 6,
//     pointsFor: 63,
//     pointsAgainst: 45,
//     pointDifference: 18,
//     rank: 1
//   },
//   // ... more standings
// ]
```

### `determineWinners(standings, winnersCount)`

Determine winners from standings (top N teams).

**Example:**
```typescript
const winners = determineWinners(standings, 2);
// Returns: ['team1', 'team2'] (top 2 teams)
```

### `getTeamsWithRank(standings, rank)`

Get all teams with a specific rank (for handling ties).

**Example:**
```typescript
const rank2Teams = getTeamsWithRank(standings, 2);
// Returns teams that are tied for 2nd place
```

### `isStandingsComplete(standings, totalTeams)`

Check if all teams have played all possible matches (round-robin complete).

**Example:**
```typescript
const complete = isStandingsComplete(standings, 4);
// Returns true if all teams have played 3 matches (4-1)
```

### `calculateWinPercentage(standing)`

Calculate win percentage for a team.

**Example:**
```typescript
const winPct = calculateWinPercentage(standing);
// Returns: 75.0 (for 3 wins out of 4 matches)
```

### `formatStandings(standings)`

Format standings for display with human-readable strings.

**Example:**
```typescript
const formatted = formatStandings(standings);
// Returns:
// [
//   {
//     rank: 1,
//     teamId: 'team1',
//     record: '5-2-1', // W-L-D
//     points: 11,
//     pointDifference: '+15',
//     winPercentage: 62.5
//   }
// ]
```

## Sorting Criteria

Standings are sorted by (in order):

1. **Points** (descending) - Primary criterion
2. **Head-to-head** (if enabled) - Direct match results
3. **Point difference** (descending) - Points scored minus points conceded
4. **Points for** (descending) - Total points scored
5. **Points against** (ascending) - Fewer points conceded is better

## Head-to-Head Tie-Breaking

When two teams have the same points, head-to-head record is checked:
- If Team A beat Team B directly, Team A ranks higher
- If teams split matches, point difference in head-to-head is used
- If still tied, overall point difference is used

## Usage in Backend

The backend API (`/api/categories/[id]/groups/[groupId]/standings`) currently implements the algorithm inline. You can optionally refactor it to use this utility:

```typescript
import { calculateStandings, determineWinners } from '@/utils/standings';

// In the API route:
const teamIds = groupRegistrations.map((gr) => gr.categoryRegistration.id);
const matches: MatchResult[] = finishedMatches.map((match) => ({
  id: match.id,
  participant1Id: match.participants[0].categoryRegistrationId,
  participant2Id: match.participants[1].categoryRegistrationId,
  participant1Score: match.player1Score || 0,
  participant2Score: match.player2Score || 0,
  winnerId: match.winnerId,
  isDraw: match.isDraw,
}));

const standings = calculateStandings(teamIds, matches);
const winners = determineWinners(standings, category.winnersPerGroup || 1);
```

## Usage in Frontend

You can use these utilities in the frontend to:
- Display standings tables
- Show win percentages
- Format standings for display
- Preview standings before matches complete

```typescript
import { formatStandings, calculateWinPercentage } from '@/utils/standings';

const formatted = formatStandings(standings);
formatted.forEach((team) => {
  console.log(`${team.rank}. ${team.teamId}: ${team.record} (${team.winPercentage}%)`);
});
```

## Points System

Default points:
- **Win**: 2 points
- **Draw**: 1 point
- **Loss**: 0 points

This can be customized via options:
```typescript
const standings = calculateStandings(teamIds, matches, {
  pointsForWin: 3, // 3 points for win
  pointsForDraw: 1,
  pointsForLoss: 0,
});
```





