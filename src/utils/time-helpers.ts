/**
 * Helper functions for time formatting and calculations
 */

export interface CourtElapsedTimeTranslations {
  lessThanMinute: string;
  oneMinute: string;
  minutes: string;
}

/**
 * Format elapsed time for court display (more readable)
 * @param startTime - The start time as string or Date
 * @param currentTime - Optional current time, defaults to new Date()
 * @param t - Translation function for internationalization
 * @param keyPrefix - Optional prefix for translation keys (e.g., "time.")
 * @returns Formatted elapsed time string
 */
export const formatCourtElapsedTime = (
  startTime: string | Date,
  currentTime: Date = new Date(),
  t: (key: string, params?: any) => string,
  keyPrefix: string = ''
): string => {
  const start = new Date(startTime);
  const elapsedMs = currentTime.getTime() - start.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  if (elapsedMinutes === 0) {
    return t(`${keyPrefix}lessThanMinute`);
  } else if (elapsedMinutes === 1) {
    return t(`${keyPrefix}oneMinute`);
  } else {
    return t(`${keyPrefix}minutes`, { minutes: elapsedMinutes });
  }
};

/**
 * Create a bound version of formatCourtElapsedTime for a specific translation context
 * This allows the function to be used without passing the translation function each time
 * @param t - Translation function
 * @param keyPrefix - Optional prefix for translation keys (e.g., "time.")
 * @returns A bound formatCourtElapsedTime function
 */
export const createCourtElapsedTimeFormatter = (
  t: (key: string, params?: any) => string,
  keyPrefix: string = ''
) => {
  return (startTime: string | Date, currentTime: Date = new Date()): string => {
    return formatCourtElapsedTime(startTime, currentTime, t, keyPrefix);
  };
};
