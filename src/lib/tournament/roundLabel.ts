type TFn = (key: string, values?: Record<string, string | number>) => string;

/**
 * Map a backend round code (e.g. "GROUP", "QF", "SF", "F", "3RD", "R16") to a
 * localized display label. Falls back to the raw value when no translation is
 * available.
 *
 * The `t` function must already be scoped to a namespace that contains the
 * round keys directly: `group`, `qf`, `sf`, `f`, `thirdPlace`, `fifthPlace`,
 * `seventhPlace`, `r16`, `r32`, `r64`, `r128`.
 */
export const getRoundDisplayLabel = (
  round: string | null | undefined,
  t: TFn
): string => {
  if (!round) return '';
  const code = round.toUpperCase();
  const map: Record<string, string> = {
    GROUP: 'group',
    F: 'f',
    SF: 'sf',
    QF: 'qf',
    '3RD': 'thirdPlace',
    '5TH': 'fifthPlace',
    '7TH': 'seventhPlace',
    R128: 'r128',
    R64: 'r64',
    R32: 'r32',
    R16: 'r16',
  };
  const key = map[code];
  if (!key) return round;
  try {
    return t(key);
  } catch {
    return round;
  }
};
