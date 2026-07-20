export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Used when the runtime cannot enumerate zones (older Safari, some RN webviews). */
const FALLBACK_TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
];

const getSupportedTimeZones = () => {
  const intlWithSupportedValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };

  try {
    const timeZones = intlWithSupportedValues.supportedValuesOf?.('timeZone');
    return timeZones?.length ? timeZones : FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
};

const getTimeZoneOffsetLabel = (timeZone: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
    })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')?.value;
  } catch {
    return undefined;
  }
};

const getTimeZoneLabel = (timeZone: string) =>
  timeZone.replaceAll('_', ' ').replace('/', ' / ');

/** Options for the timezone picker, always including the current value. */
export const getTimeZoneOptions = (currentTimeZone: string) => {
  const timeZones = new Set(getSupportedTimeZones());
  if (currentTimeZone) {
    timeZones.add(currentTimeZone);
  }

  return [...timeZones].sort().map((timeZone) => {
    const offset = getTimeZoneOffsetLabel(timeZone);

    return {
      value: timeZone,
      label: getTimeZoneLabel(timeZone),
      sublabel: offset ? `${timeZone} · ${offset}` : timeZone,
    };
  });
};
