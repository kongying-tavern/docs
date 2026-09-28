export function updateUrlHash(hash: string): void {
  const nextHash = hash.startsWith('#') ? hash : `#${hash}`
  if (window.location.hash === nextHash)
    return

  history.replaceState(history.state, '', `${window.location.href.split('#')[0]}${nextHash}`)
  window.dispatchEvent(new Event('hashchange'))
}
