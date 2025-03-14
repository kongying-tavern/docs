import { getScrollOffset } from 'vitepress'

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
  catch (e) {
    console.warn(e)
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
