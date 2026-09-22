const SETTINGS_RETURN_URL_KEY = 'settings-return-url'

export function rememberSettingsReturnUrl(url = location.href): void {
  sessionStorage.setItem(SETTINGS_RETURN_URL_KEY, url)
}

export function consumeSettingsReturnUrl(): string | null {
  const url = sessionStorage.getItem(SETTINGS_RETURN_URL_KEY)
  sessionStorage.removeItem(SETTINGS_RETURN_URL_KEY)
  return url
}
