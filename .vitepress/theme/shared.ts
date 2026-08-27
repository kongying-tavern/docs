export function enableTransitions() {
  return (
    'startViewTransition' in document
    && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  )
}
