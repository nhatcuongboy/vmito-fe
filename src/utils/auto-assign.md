# Auto-Assign Algorithm

Utility functions for automatically distributing teams/registrations evenly across groups.

## Overview

Auto-assign algorithm distributes teams across groups using different strategies:
- **Round-robin**: Distribute in order, cycling through groups
- **Sequential**: Fill each group completely before moving to next
- **Balanced**: Try to keep groups as equal as possible

## Functions

### `autoAssignTeamsToGroups(registrations, groups, options)`

Automatically assign registrations to groups using specified strategy.

**Parameters:**
- `registrations`: Array of registration IDs (strings)
- `groups`: Array of groups with `id` and `groupNumber`
- `options`: 
  - `shuffle?: boolean` - Randomize before assigning (default: true)
  - `strategy?: 'round-robin' | 'sequential' | 'balanced'` (default: 'round-robin')

**Returns:**
```typescript
{
  assignments: Record<string, string[]>; // groupId -> registrationIds[]
  distribution: Array<{
    groupId: string;
    groupNumber: number;
    registrationCount: number;
  }>;
  totalAssigned: number;
  averagePerGroup: number;
  isBalanced: boolean;
}
```

**Example:**
```typescript
import { autoAssignTeamsToGroups } from '@/utils/auto-assign';

const registrations = ['reg1', 'reg2', 'reg3', 'reg4', 'reg5', 'reg6', 'reg7', 'reg8', 'reg9', 'reg10'];
const groups = [
  { id: 'group1', groupNumber: 1 },
  { id: 'group2', groupNumber: 2 },
  { id: 'group3', groupNumber: 3 }
];

const result = autoAssignTeamsToGroups(registrations, groups, {
  shuffle: true,
  strategy: 'round-robin'
});

// Result:
// {
//   assignments: {
//     'group1': ['reg1', 'reg4', 'reg7', 'reg10'],
//     'group2': ['reg2', 'reg5', 'reg8'],
//     'group3': ['reg3', 'reg6', 'reg9']
//   },
//   distribution: [
//     { groupId: 'group1', groupNumber: 1, registrationCount: 4 },
//     { groupId: 'group2', groupNumber: 2, registrationCount: 3 },
//     { groupId: 'group3', groupNumber: 3, registrationCount: 3 }
//   ],
//   totalAssigned: 10,
//   averagePerGroup: 3.33,
//   isBalanced: false
// }
```

### `calculateOptimalDistribution(totalTeams, groupCount)`

Calculate optimal distribution for given number of teams and groups.

**Example:**
```typescript
const dist = calculateOptimalDistribution(10, 3);
// Returns:
// {
//   baseTeamsPerGroup: 3,
//   groupsWithExtra: 1,
//   minTeamsPerGroup: 3,
//   maxTeamsPerGroup: 4,
//   isBalanced: false
// }
```

### `validateAutoAssign(totalTeams, groupCount)`

Validate if auto-assignment is possible.

**Example:**
```typescript
validateAutoAssign(10, 3); // { valid: true }
validateAutoAssign(2, 5); // { valid: false, error: 'Cannot assign...' }
```

### `previewDistribution(totalTeams, groupCount, strategy)`

Preview how teams will be distributed before actual assignment.

**Example:**
```typescript
const preview = previewDistribution(10, 3, 'balanced');
// Returns:
// {
//   distribution: [
//     { groupNumber: 1, teamCount: 4 },
//     { groupNumber: 2, teamCount: 3 },
//     { groupNumber: 3, teamCount: 3 }
//   ],
//   totalTeams: 10,
//   averagePerGroup: 3.33,
//   isBalanced: false
// }
```

## Strategies

### Round-Robin
Distributes teams in order, cycling through groups:
- Team 1 → Group 1
- Team 2 → Group 2
- Team 3 → Group 3
- Team 4 → Group 1 (cycle back)
- Team 5 → Group 2
- etc.

**Best for**: Fair distribution when order doesn't matter

### Sequential
Fills each group completely before moving to next:
- Teams 1-4 → Group 1
- Teams 5-7 → Group 2
- Teams 8-10 → Group 3

**Best for**: When you want to keep teams together

### Balanced
Tries to keep groups as equal as possible:
- Distributes extra teams to first groups
- Similar to sequential but optimized

**Best for**: Most balanced distribution

## Usage in Backend

The backend API (`/api/categories/[id]/groups/auto-assign`) currently implements the algorithm inline. You can optionally refactor it to use this utility:

```typescript
import { autoAssignTeamsToGroups } from '@/utils/auto-assign';

// In the API route:
const groups = await prisma.categoryGroup.findMany({...});
const registrations = await prisma.categoryRegistration.findMany({...});

const result = autoAssignTeamsToGroups(
  registrations.map(r => r.id),
  groups.map(g => ({ id: g.id, groupNumber: g.groupNumber })),
  { shuffle: true, strategy: 'round-robin' }
);

// Then create assignments from result.assignments
```

## Usage in Frontend

You can use these utilities in the frontend to:
- Preview distribution before assigning
- Show expected team counts per group
- Validate before submission

```typescript
import { previewDistribution, validateAutoAssign } from '@/utils/auto-assign';

const validation = validateAutoAssign(registrations.length, groupCount);
if (!validation.valid) {
  alert(validation.error);
  return;
}

const preview = previewDistribution(registrations.length, groupCount);
console.log(`Teams will be distributed as:`, preview.distribution);
```

## Distribution Examples

### 10 teams, 3 groups
- Base: 3 teams per group
- Extra: 1 team
- Result: 4, 3, 3 teams

### 12 teams, 4 groups
- Base: 3 teams per group
- Extra: 0 teams
- Result: 3, 3, 3, 3 teams (balanced)

### 7 teams, 3 groups
- Base: 2 teams per group
- Extra: 1 team
- Result: 3, 2, 2 teams





