/** Caller-defined timing wins; desktop timing remains owned by site preferences. */
export function resolveToastTiming(
  mobile: boolean,
  kind: string,
  options: { duration?: number, closeButton?: boolean, action?: unknown, cancel?: unknown } = {},
): { duration?: number, closeButton?: boolean } {
  if (!mobile)
    return { duration: options.duration, closeButton: options.closeButton }
  const persistent = kind === 'error' || Boolean(options.action || options.cancel)
  const duration = options.duration ?? (persistent ? Number.POSITIVE_INFINITY : undefined)
  return {
    duration,
    closeButton: options.closeButton ?? (duration === Number.POSITIVE_INFINITY ? true : undefined),
  }
}
