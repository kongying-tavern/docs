export function enableTransitions() {
  return (
    'startViewTransition' in document
    && document.visibilityState === 'visible'
    && document.documentElement.dataset.reducedMotion !== 'true'
  )
}
