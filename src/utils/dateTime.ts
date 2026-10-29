/** Select real unit boundaries; 24 hours is a day, not 24 hours or 1 month. */
export function relativeTimeValue(timestamp: number, now: number): { value: number, unit: Intl.RelativeTimeFormatUnit } {
  const seconds = (timestamp - now) / 1000
  const magnitude = Math.abs(seconds)
  const units = [
    [60, 1, 'second'],
    [3600, 60, 'minute'],
    [86400, 3600, 'hour'],
    [2592000, 86400, 'day'],
    [31536000, 2592000, 'month'],
    [Infinity, 31536000, 'year'],
  ] as const
  const [, divisor, unit] = units.find(([limit]) => magnitude < limit)!
  const rounded = Math.round(seconds / divisor)
  return { value: Object.is(rounded, -0) ? 0 : rounded, unit }
}
