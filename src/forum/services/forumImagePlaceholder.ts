import { thumbHashToDataURL } from 'thumbhash'

const placeholders = new Map<string, string | undefined>()

/** Remounting a virtual row must not decode the same placeholder again. */
export function forumImagePlaceholder(hash: string): string | undefined {
  if (placeholders.has(hash)) {
    const cached = placeholders.get(hash)
    placeholders.delete(hash)
    placeholders.set(hash, cached)
    return cached
  }
  let placeholder: string | undefined
  try {
    placeholder = thumbHashToDataURL(Uint8Array.from(atob(hash), character => character.charCodeAt(0)))
  }
  catch {
    // Invalid optional metadata must not prevent the real image from loading.
  }
  placeholders.set(hash, placeholder)
  if (placeholders.size > 128)
    placeholders.delete(placeholders.keys().next().value!)
  return placeholder
}
