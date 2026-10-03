interface ScrollToOptions {
  offset?: number
  smooth?: boolean
  el?: Element
  hash?: string
}

export function scrollTo(options: ScrollToOptions = {}) {
  if (typeof window === 'undefined')
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
    const targetMargin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0
    const scrollPadding = Number.parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    const targetTop
      = window.scrollY
        + target.getBoundingClientRect().top
        - targetMargin
        - scrollPadding
        + offset
    function scrollToTarget() {
      const animate = smooth
        && Math.abs(targetTop - window.scrollY) <= window.innerHeight
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ left: 0, top: targetTop, behavior: animate ? 'smooth' : 'instant' })
    }
    requestAnimationFrame(scrollToTarget)
  }
}
