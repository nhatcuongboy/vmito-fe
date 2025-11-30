# Round-Robin Tournament Algorithm

Utility functions for generating round-robin tournament matches.

## Overview

Round-robin tournament: Each team plays against every other team exactly once.

**Formula**: For `n` teams, total matches = `n * (n - 1) / 2`

## Functions

### `generateRoundRobinMatches(registrations: string[])`

Generate all round-robin matches for a given set of registration IDs.

**Parameters:**
- `registrations`: Array of registration IDs (strings)

**Returns:**
```typescript
{
  matches: RoundRobinMatch[];
  totalMatches: number;
  teamsCount: number;
}
```

**Example:**
```typescript
import { generateRoundRobinMatches } from '@/utils/round-robin';

const registrations = ['reg1', 'reg2', 'reg3', 'reg4'];
const result = generateRoundRobinMatches(registrations);

// Result:
// {
//   matches: [
//     { participant1Id: 'reg1', participant2Id: 'reg2', matchNumber: 1 },
//     { participant1Id: 'reg1', participant2Id: 'reg3', matchNumber: 2 },
//     { participant1Id: 'reg1', participant2Id: 'reg4', matchNumber: 3 },
//     { participant1Id: 'reg2', participant2Id: 'reg3', matchNumber: 4 },
//     { participant1Id: 'reg2', participant2Id: 'reg4', matchNumber: 5 },
//     { participant1Id: 'reg3', participant2Id: 'reg4', matchNumber: 6 }
//   ],
//   totalMatches: 6,
//   teamsCount: 4
// }
```

### `calculateTotalMatches(teamsCount: number)`

Calculate total number of matches for a round-robin tournament.

**Example:**
```typescript
calculateTotalMatches(4); // Returns 6
calculateTotalMatches(8); // Returns 28
```

### `isValidRoundRobinTournament(teamsCount: number)`

Validate if round-robin tournament is possible (requires at least 2 teams).

**Example:**
```typescript
isValidRoundRobinTournament(4); // Returns true
isValidRoundRobinTournament(1); // Returns false
```

### `generateRoundRobinRounds(registrations: string[])`

Generate round-robin matches organized into rounds (for scheduling purposes).

Each round contains matches where each team plays at most once.

**Example:**
```typescript
const registrations = ['reg1', 'reg2', 'reg3', 'reg4'];
const rounds = generateRoundRobinRounds(registrations);

// Returns:
// [
//   [
//     { participant1Id: 'reg1', participant2Id: 'reg4' },
//     { participant1Id: 'reg2', participant2Id: 'reg3' }
//   ],
//   [
//     { participant1Id: 'reg1', participant2Id: 'reg3' },
//     { participant1Id: 'reg4', participant2Id: 'reg2' }
//   ],
//   [
//     { participant1Id: 'reg1', participant2Id: 'reg2' },
//     { participant1Id: 'reg3', participant2Id: 'reg4' }
//   ]
// ]
```

### `calculateRoundsCount(teamsCount: number)`

Calculate number of rounds needed for a round-robin tournament.

- Even number of teams: `n - 1` rounds
- Odd number of teams: `n` rounds

## Usage in Backend

The backend API (`/api/categories/[id]/groups/[groupId]/generate-matches`) currently implements the algorithm inline. You can optionally refactor it to use this utility:

```typescript
import { generateRoundRobinMatches } from '@/utils/round-robin';

// In the API route:
const registrations = group.registrations.map((gr) => gr.categoryRegistration.id);
const { matches: roundRobinMatches } = generateRoundRobinMatches(registrations);

// Then create matches from roundRobinMatches
```

## Usage in Frontend

You can use these utilities in the frontend to:
- Preview matches before generating
- Calculate total matches for display
- Validate group sizes

```typescript
import { calculateTotalMatches } from '@/utils/round-robin';

const totalMatches = calculateTotalMatches(registrations.length);
console.log(`This group will have ${totalMatches} matches`);
```

## Test Cases

See `round-robin.test.ts` for comprehensive test cases covering:
- Various team counts (2, 3, 4, 5, 8, 10 teams)
- Edge cases (0, 1 teams)
- Match numbering
- Round generation
- Validation





