/**
 * Get the current header offset from CSS custom properties.
 * Replaces the removed `getScrollOffset()` from VitePress 1.x.
 */
function getScrollOffset(): number {
  if (typeof document === 'undefined')
    return 0
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('scroll-padding-top')
  // Parse value like "64px" or "calc(64px + 1rem)" → number in px
  const el = document.createElement('div')
  el.style.position = 'absolute'
  el.style.visibility = 'hidden'
  el.style.height = value || '0px'
  document.body.appendChild(el)
  const px = el.offsetHeight
  document.body.removeChild(el)
  return px
}

interface ScrollToOptions {
  offset?: number
  smooth?: boolean
  el?: Element
  hash?: string
}

export function scrollTo(options: ScrollToOptions = {}) {
  if (import.meta.env.SSR || !location.hash)
    return

  const { el, offset = 0, smooth = true, hash = location.hash } = options

  let target: Element | null = null

  try {
    target = el || document.getElementById(decodeURIComponent(hash).slice(1))
  }
  catch {
    // Invalid hash/selector, ignore
  }

  if (target) {
    const targetPadding = Number.parseInt(
      window.getComputedStyle(target).paddingTop,
      10,
    )
    const targetTop
      = window.scrollY
        + target.getBoundingClientRect().top
        - getScrollOffset()
        + targetPadding
        + offset
    function scrollToTarget() {
      // only smooth scroll if distance is smaller than screen height.
      if (!smooth || Math.abs(targetTop - window.scrollY) > window.innerHeight)
        window.scrollTo(0, targetTop)
      else window.scrollTo({ left: 0, top: targetTop, behavior: 'smooth' })
    }
    requestAnimationFrame(scrollToTarget)
  }
}
