import type { INTER_KNOT } from './api'
import { fetcher } from '.'

export async function translate(text: string, targetLanguage?: string, sourceLanguage?: string): Promise<INTER_KNOT.TranslateResponse | null> {
  if (import.meta.env.SSR)
    return null

  return fetcher
    .get('translate', {
      searchParams: {
        text,
        targetLanguage,
        sourceLanguage,
      },
    })
    .json<INTER_KNOT.TranslateResponse>()
}

export async function getLanguages(): Promise<INTER_KNOT.LanguageResponse | null> {
  if (import.meta.env.SSR)
    return null

  return fetcher.get('translate/languages').json<INTER_KNOT.LanguageResponse>()
}
