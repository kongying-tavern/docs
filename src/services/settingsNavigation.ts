let settingsReturnUrl: string | null = null

export function rememberSettingsReturnUrl(url = location.href): void {
  settingsReturnUrl = url
}

export function consumeSettingsReturnUrl(): string | null {
  const url = settingsReturnUrl
  settingsReturnUrl = null
  return url
}
