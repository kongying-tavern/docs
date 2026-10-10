let settingsReturnUrl: string | null = null

export function rememberSettingsReturnUrl(url = location.href): void {
  settingsReturnUrl = url
}

export function consumeSettingsReturnUrl(): string | null {
  const url = settingsReturnUrl
  settingsReturnUrl = null
  return url
}

/** Also usable while the settings component is still downloading. */
export function closeSettingsDialog(): void {
  const saved = consumeSettingsReturnUrl()
  const currentUrl = location.href
  const target = saved ? new URL(saved, location.href) : new URL(location.href)
  if (!saved)
    target.hash = ''
  history.replaceState(history.state, '', target)
  window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: currentUrl, newURL: target.href }))
}

/** Shared by both the loaded navigation and the synchronous settings shell. */
export function closeSettingsPage(go: (url: string) => unknown, fallbackHref: string): void {
  const saved = consumeSettingsReturnUrl()
  if (saved && saved !== location.href) {
    void go(saved)
    return
  }
  if (document.referrer && document.referrer !== location.href && new URL(document.referrer).origin === location.origin) {
    history.back()
    return
  }
  void go(fallbackHref)
}
