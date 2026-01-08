/**
 * Auto-Assign Algorithm Utilities
 *
 * Automatically distribute teams/registrations evenly across groups
 * using round-robin distribution or shuffle-based assignment.
 */

export interface AutoAssignOptions {
  shuffle?: boolean; // Randomize before assigning (default: true)
  strategy?: 'round-robin' | 'sequential' | 'balanced';
}

export interface AutoAssignResult {
  assignments: Record<string, string[]>; // groupId -> registrationIds[]
  distribution: {
    groupId: string;
    groupNumber: number;
    registrationCount: number;
  }[];
  totalAssigned: number;
  averagePerGroup: number;
  isBalanced: boolean; // True if all groups have same or ±1 count
}

/**
 * Auto-assign registrations to groups using round-robin distribution
 *
 * @param registrations - Array of registration IDs to assign
 * @param groups - Array of groups with id and groupNumber
 * @param options - Assignment options (shuffle, strategy)
 * @returns Assignment result with distribution details
 *
 * @example
 * const registrations = ['reg1', 'reg2', 'reg3', 'reg4', 'reg5', 'reg6', 'reg7', 'reg8', 'reg9', 'reg10'];
 * const groups = [
 *   { id: 'group1', groupNumber: 1 },
 *   { id: 'group2', groupNumber: 2 },
 *   { id: 'group3', groupNumber: 3 }
 * ];
 * const result = autoAssignTeamsToGroups(registrations, groups, { shuffle: true });
 * // Result:
 * // {
 * //   assignments: {
 * //     'group1': ['reg1', 'reg4', 'reg7', 'reg10'],
 * //     'group2': ['reg2', 'reg5', 'reg8'],
 * //     'group3': ['reg3', 'reg6', 'reg9']
 * //   },
 * //   distribution: [
 * //     { groupId: 'group1', groupNumber: 1, registrationCount: 4 },
 * //     { groupId: 'group2', groupNumber: 2, registrationCount: 3 },
 * //     { groupId: 'group3', groupNumber: 3, registrationCount: 3 }
 * //   ],
 * //   totalAssigned: 10,
 * //   averagePerGroup: 3.33,
 * //   isBalanced: false
 * // }
 */
export function autoAssignTeamsToGroups(
  registrations: string[],
  groups: Array<{ id: string; groupNumber: number }>,
  options: AutoAssignOptions = {}
): AutoAssignResult {
  const { shuffle = true, strategy = 'round-robin' } = options;

  if (registrations.length === 0) {
    return {
      assignments: {},
      distribution: groups.map((g) => ({
        groupId: g.id,
        groupNumber: g.groupNumber,
        registrationCount: 0,
      })),
      totalAssigned: 0,
      averagePerGroup: 0,
      isBalanced: true,
    };
  }

  if (groups.length === 0) {
    throw new Error('At least one group is required');
  }

  // Prepare registrations based on strategy
  const registrationsToAssign = [...registrations];

  if (shuffle) {
    // Fisher-Yates shuffle algorithm
    for (let i = registrationsToAssign.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [registrationsToAssign[i], registrationsToAssign[j]] = [
        registrationsToAssign[j],
        registrationsToAssign[i],
      ];
    }
  }

  // Initialize assignments
  const assignments: Record<string, string[]> = {};
  groups.forEach((group) => {
    assignments[group.id] = [];
  });

  // Distribute based on strategy
  switch (strategy) {
    case 'round-robin':
      // Round-robin: distribute in order, cycling through groups
      registrationsToAssign.forEach((registration, index) => {
        const groupIndex = index % groups.length;
        const group = groups[groupIndex];
        assignments[group.id].push(registration);
      });
      break;

    case 'sequential': {
      // Sequential: fill each group completely before moving to next
      const registrationsPerGroup = Math.floor(
        registrationsToAssign.length / groups.length
      );
      const remainder = registrationsToAssign.length % groups.length;

      let registrationIndex = 0;
      groups.forEach((group, groupIndex) => {
        const count = registrationsPerGroup + (groupIndex < remainder ? 1 : 0);
        assignments[group.id] = registrationsToAssign.slice(
          registrationIndex,
          registrationIndex + count
        );
        registrationIndex += count;
      });
      break;
    }

    case 'balanced': {
      // Balanced: try to keep groups as equal as possible
      const avgPerGroup = registrationsToAssign.length / groups.length;
      const baseCount = Math.floor(avgPerGroup);
      const extraCount = registrationsToAssign.length % groups.length;

      let registrationIndex = 0;
      groups.forEach((group, groupIndex) => {
        const count = baseCount + (groupIndex < extraCount ? 1 : 0);
        assignments[group.id] = registrationsToAssign.slice(
          registrationIndex,
          registrationIndex + count
        );
        registrationIndex += count;
      });
      break;
    }

    default:
      throw new Error(`Unknown strategy: ${strategy}`);
  }

  // Calculate distribution stats
  const distribution = groups.map((group) => ({
    groupId: group.id,
    groupNumber: group.groupNumber,
    registrationCount: assignments[group.id].length,
  }));

  const totalAssigned = registrations.length;
  const averagePerGroup = totalAssigned / groups.length;

  // Check if balanced (all groups have same count or ±1)
  const counts = distribution.map((d) => d.registrationCount);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);
  const isBalanced = maxCount - minCount <= 1;

  return {
    assignments,
    distribution,
    totalAssigned,
    averagePerGroup,
    isBalanced,
  };
}

/**
 * Calculate optimal group distribution for given number of teams and groups
 *
 * @param totalTeams - Total number of teams
 * @param groupCount - Number of groups
 * @returns Distribution info
 */
export function calculateOptimalDistribution(
  totalTeams: number,
  groupCount: number
): {
  baseTeamsPerGroup: number;
  groupsWithExtra: number;
  minTeamsPerGroup: number;
  maxTeamsPerGroup: number;
  isBalanced: boolean;
} {
  if (groupCount === 0) {
    throw new Error('Group count must be at least 1');
  }

  const baseTeamsPerGroup = Math.floor(totalTeams / groupCount);
  const groupsWithExtra = totalTeams % groupCount;
  const minTeamsPerGroup = baseTeamsPerGroup;
  const maxTeamsPerGroup = baseTeamsPerGroup + (groupsWithExtra > 0 ? 1 : 0);
  const isBalanced = groupsWithExtra === 0 || groupsWithExtra === groupCount;

  return {
    baseTeamsPerGroup,
    groupsWithExtra,
    minTeamsPerGroup,
    maxTeamsPerGroup,
    isBalanced,
  };
}

/**
 * Validate if auto-assignment is possible
 *
 * @param totalTeams - Total number of teams
 * @param groupCount - Number of groups
 * @returns Validation result
 */
export function validateAutoAssign(
  totalTeams: number,
  groupCount: number
): {
  valid: boolean;
  error?: string;
} {
  if (totalTeams < 1) {
    return {
      valid: false,
      error: 'At least one team is required',
    };
  }

  if (groupCount < 1) {
    return {
      valid: false,
      error: 'At least one group is required',
    };
  }

  if (totalTeams < groupCount) {
    return {
      valid: false,
      error: `Cannot assign ${totalTeams} teams to ${groupCount} groups. Need at least ${groupCount} teams.`,
    };
  }

  return { valid: true };
}

/**
 * Get distribution preview before actual assignment
 *
 * @param totalTeams - Total number of teams
 * @param groupCount - Number of groups
 * @param strategy - Assignment strategy
 * @returns Preview of how teams will be distributed
 */
export function previewDistribution(
  totalTeams: number,
  groupCount: number,
  strategy: AutoAssignOptions['strategy'] = 'round-robin'
): {
  distribution: Array<{
    groupNumber: number;
    teamCount: number;
  }>;
  totalTeams: number;
  averagePerGroup: number;
  isBalanced: boolean;
} {
  const validation = validateAutoAssign(totalTeams, groupCount);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const optimal = calculateOptimalDistribution(totalTeams, groupCount);

  const distribution: Array<{ groupNumber: number; teamCount: number }> = [];

  if (strategy === 'balanced' || strategy === 'sequential') {
    // Both strategies produce same result for balanced distribution
    for (let i = 1; i <= groupCount; i++) {
      distribution.push({
        groupNumber: i,
        teamCount:
          optimal.baseTeamsPerGroup + (i <= optimal.groupsWithExtra ? 1 : 0),
      });
    }
  } else {
    // Round-robin: same as balanced for preview
    for (let i = 1; i <= groupCount; i++) {
      distribution.push({
        groupNumber: i,
        teamCount:
          optimal.baseTeamsPerGroup + (i <= optimal.groupsWithExtra ? 1 : 0),
      });
    }
  }

  return {
    distribution,
    totalTeams,
    averagePerGroup:
      optimal.baseTeamsPerGroup + optimal.groupsWithExtra / groupCount,
    isBalanced: optimal.isBalanced,
  };
}
