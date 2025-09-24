import { nextTick } from 'vue'

// Scroll utilities
export interface ScrollToOptions {
  element?: Element | string
  offset?: number
  behavior?: ScrollBehavior
  duration?: number
}

export function scrollTo(options: ScrollToOptions = {}): void {
  const {
    element,
    offset = 0,
    behavior = 'smooth',
    duration = 500,
  } = options

  let targetElement: Element | null = null

  if (typeof element === 'string') {
    targetElement = document.querySelector(element)
  }
  else if (element instanceof Element) {
    targetElement = element
  }

  const targetPosition = targetElement
    ? targetElement.getBoundingClientRect().top + window.pageYOffset + offset
    : offset

  if (behavior === 'smooth' && typeof window.requestAnimationFrame === 'function') {
    smoothScrollTo(targetPosition, duration)
  }
  else {
    window.scrollTo({
      top: targetPosition,
      behavior,
    })
  }
}

function smoothScrollTo(targetPosition: number, duration: number): void {
  const startPosition = window.pageYOffset
  const distance = targetPosition - startPosition
  const startTime = performance.now()

  function animation(currentTime: number): void {
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)

    // Easing function (ease-in-out)
    const easing = progress < 0.5
      ? 2 * progress * progress
      : 1 - (-2 * progress + 2) ** 3 / 2

    window.scrollTo(0, startPosition + distance * easing)

    if (timeElapsed < duration) {
      requestAnimationFrame(animation)
    }
  }

  requestAnimationFrame(animation)
}

// Element utilities
export function getElementHeight(): number {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight,
  )
}

export function isElementInViewport(element: Element, threshold: number = 0): boolean {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  return (
    rect.top >= -threshold
    && rect.left >= -threshold
    && rect.bottom <= windowHeight + threshold
    && rect.right <= windowWidth + threshold
  )
}

export function getScrollParent(element: Element): Element | null {
  if (!element || element === document.body)
    return null

  const style = window.getComputedStyle(element)
  const isScrollable = /auto|scroll/.test(
    style.overflow + style.overflowX + style.overflowY,
  )

  if (isScrollable)
    return element
  return getScrollParent(element.parentElement!)
}

// Focus management
export function focusElement(
  selector: string | Element,
  options: { preventScroll?: boolean, delay?: number } = {},
): Promise<void> {
  const { preventScroll = false, delay = 0 } = options

  return new Promise((resolve) => {
    const focusAction = () => {
      let element: Element | null = null

      if (typeof selector === 'string') {
        element = document.querySelector(selector)
      }
      else {
        element = selector
      }

      if (element && 'focus' in element && typeof element.focus === 'function') {
        ;(element as HTMLElement).focus({ preventScroll })
      }

      resolve()
    }

    if (delay > 0) {
      setTimeout(focusAction, delay)
    }
    else {
      nextTick(focusAction)
    }
  })
}

export function blurActiveElement(): void {
  if (document.activeElement && 'blur' in document.activeElement) {
    ;(document.activeElement as HTMLElement).blur()
  }
}

// Clipboard utilities
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  }
  catch (error) {
    console.error('Failed to copy text to clipboard:', error)
    return false
  }
}

// Event utilities
export function addGlobalEventListener(
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
): () => void {
  document.addEventListener(event, handler, options)

  return () => {
    document.removeEventListener(event, handler, options)
  }
}

// Re-export from lodash-es to avoid duplication
export { debounce, throttle } from 'lodash-es'

// URL utilities
export function updateUrlPath(newSegment: string, replace: boolean = true): void {
  if (!newSegment)
    return

  const { pathname, search, hash } = window.location
  const segments = pathname.replace(/\/+$/, '').split('/')

  if (segments.length === 0 || (segments.length === 1 && segments[0] === '')) {
    segments[0] = newSegment
  }
  else {
    segments[segments.length - 1] = newSegment
  }

  const newPath = `/${segments.filter(Boolean).join('/')}`
  const newUrl = `${newPath}${search}${hash}`

  const method = replace ? 'replaceState' : 'pushState'
  history[method](null, '', newUrl)
}

export function updateUrlHash(hash: string): void {
  const newHash = hash.startsWith('#') ? hash : `#${hash}`
  if (window.location.hash !== newHash) {
    window.location.hash = newHash
  }
}

// CSS utilities
export function addCssClass(element: Element, className: string): void {
  if (!element.classList.contains(className)) {
    element.classList.add(className)
  }
}

export function removeCssClass(element: Element, className: string): void {
  if (element.classList.contains(className)) {
    element.classList.remove(className)
  }
}

export function toggleCssClass(element: Element, className: string): boolean {
  return element.classList.toggle(className)
}

// Media query utilities
export function getBreakpointMatch(breakpoint: string): boolean {
  return window.matchMedia(breakpoint).matches
}

export function createMediaQueryWatcher(
  breakpoint: string,
  callback: (matches: boolean) => void,
): () => void {
  const mediaQuery = window.matchMedia(breakpoint)

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches)
  }

  mediaQuery.addEventListener('change', handler)

  // Call immediately with current state
  callback(mediaQuery.matches)

  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}
