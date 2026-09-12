export function enableTransitions() {
  return (
    'startViewTransition' in document
    && document.visibilityState === 'visible'
    && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  )
}
