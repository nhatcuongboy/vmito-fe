// Fuzzy Search Examples for SearchableSelect Component

/**
 * This file demonstrates how the fuzzy search works in SearchableSelect
 *
 * The fuzzy search algorithm allows users to search with partial, non-consecutive characters.
 * It matches characters in sequence but not necessarily consecutive.
 *
 * Examples:
 *
 * 1. Query: "bmt"
 *    Matches: "Badminton", "Big Match Today"
 *    Explanation: The characters 'b', 'm', 't' appear in order
 *
 * 2. Query: "hcm"
 *    Matches: "Ho Chi Minh City", "High Class Match"
 *    Explanation: The characters 'h', 'c', 'm' appear in order
 *
 * 3. Query: "ngyn"
 *    Matches: "Nguyen Van A", "Nguyen Thi B"
 *    Explanation: The characters 'n', 'g', 'y', 'n' appear in order
 *
 * Scoring System:
 * - +1 point for each character match
 * - +2 * consecutiveCount for consecutive character matches
 * - +10 bonus for matching at the start of text
 * - +5 bonus for matching after a space (word boundary)
 * - -0.5 * lengthDiff penalty for longer text
 *
 * Results are sorted by score (highest first), so more relevant matches appear first.
 *
 * Usage:
 * Simply type partial characters in the search box. For example:
 * - Type "vna" to find "Nguyen Van A"
 * - Type "hcm" to find "Ho Chi Minh City"
 * - Type "bd" to find "Badminton"
 */

export const fuzzySearchExamples = [
  {
    query: 'bmt',
    matches: ['Badminton', 'Big Match Today', 'Basketball Match Time'],
  },
  {
    query: 'hcm',
    matches: ['Ho Chi Minh City', 'High Class Match'],
  },
  {
    query: 'ngyn',
    matches: ['Nguyen Van A', 'Nguyen Thi B'],
  },
  {
    query: 'vna',
    matches: ['Nguyen Van A', 'Tran Van An'],
  },
];
