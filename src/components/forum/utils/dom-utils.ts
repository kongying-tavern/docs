export function updateUrlHash(hash: string): void {
  const newHash = hash.startsWith('#') ? hash : `#${hash}`
  if (window.location.hash !== newHash) {
    window.location.hash = newHash
  }
}
