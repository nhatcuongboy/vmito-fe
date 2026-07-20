const partsInTimeZone = (value: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  ) as Record<string, number>;
};

export const venueDateTimeToIso = (
  date: string,
  time: string,
  timeZone = 'Asia/Ho_Chi_Minh'
) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = target;

  // Two passes also handle daylight-saving offset changes around the target.
  for (let pass = 0; pass < 2; pass += 1) {
    const parts = partsInTimeZone(new Date(candidate), timeZone);
    const rendered = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute
    );
    candidate += target - rendered;
  }

  return new Date(candidate).toISOString();
};

export const venueDateValue = (
  value: string,
  timeZone = 'Asia/Ho_Chi_Minh'
) => {
  const parts = partsInTimeZone(new Date(value), timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

export const venueTimeValue = (
  value: string,
  timeZone = 'Asia/Ho_Chi_Minh'
) => {
  const parts = partsInTimeZone(new Date(value), timeZone);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
};
