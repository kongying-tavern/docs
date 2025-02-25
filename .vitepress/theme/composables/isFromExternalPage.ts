export function isFromExternalPage() {
  if (import.meta.env.SSR)
    return false

  const referrer = document.referrer
  const navigationEntry = performance.getEntriesByType(
    'navigation',
  )[0] as PerformanceNavigationTiming

  if (!navigationEntry)
    return false // 获取不到数据，默认内部跳转

  const isNewNavigation = navigationEntry.type === 'navigate'

  if (!referrer)
    return isNewNavigation

  try {
    const referrerUrl = new URL(referrer)
    return referrerUrl.hostname !== window.location.hostname
  }
  catch {
    return true
  }
}
