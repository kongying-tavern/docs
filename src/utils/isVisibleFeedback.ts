/** A rendered result only replaces a toast when it is visible in the active viewport. */
export function isVisibleFeedback(element: Element): boolean {
  if (document.visibilityState !== 'visible' || !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
    return false

  const rect = element.getBoundingClientRect()
  // A partially visible badge may expose only its icon rather than the changed value.
  if (rect.left < 0 || rect.top < 0 || rect.right > window.innerWidth || rect.bottom > window.innerHeight)
    return false
  const left = Math.max(0, rect.left)
  const top = Math.max(0, rect.top)
  const right = Math.min(window.innerWidth, rect.right)
  const bottom = Math.min(window.innerHeight, rect.bottom)
  if (right <= left || bottom <= top)
    return false

  // Hit testing also excludes results behind dialogs or clipped by scroll containers.
  const hit = document.elementFromPoint((left + right) / 2, (top + bottom) / 2)
  return hit !== null && element.contains(hit)
}
