export function canonicalizeLanguage(language?: string | null): string | null {
  if (!language)
    return null
  try {
    return Intl.getCanonicalLocales(language)[0] ?? null
  }
  catch {
    return null
  }
}

export function areLanguagesEquivalent(first?: string | null, second?: string | null): boolean {
  const firstLanguage = canonicalizeLanguage(first)
  const secondLanguage = canonicalizeLanguage(second)
  if (!firstLanguage || !secondLanguage)
    return false
  if (firstLanguage === secondLanguage)
    return true

  const firstLocale = new Intl.Locale(firstLanguage).maximize()
  const secondLocale = new Intl.Locale(secondLanguage).maximize()
  return firstLocale.language === secondLocale.language && firstLocale.script === secondLocale.script
}

/** 粗分文字系统。用于校验「声明的语言」与文本是否自相矛盾，不做完整语言识别。 */
type TextScript = keyof typeof SCRIPT_CHARACTERS

const SCRIPT_CHARACTERS = {
  latin: /\p{Script=Latin}/u,
  cyrillic: /\p{Script=Cyrillic}/u,
  greek: /\p{Script=Greek}/u,
  arabic: /\p{Script=Arabic}/u,
  hebrew: /\p{Script=Hebrew}/u,
  han: /\p{Script=Han}/u,
  kana: /[\p{Script=Hiragana}\p{Script=Katakana}]/u,
  hangul: /\p{Script=Hangul}/u,
  devanagari: /\p{Script=Devanagari}/u,
  bengali: /\p{Script=Bengali}/u,
  tamil: /\p{Script=Tamil}/u,
  thai: /\p{Script=Thai}/u,
  lao: /\p{Script=Lao}/u,
  khmer: /\p{Script=Khmer}/u,
  myanmar: /\p{Script=Myanmar}/u,
  georgian: /\p{Script=Georgian}/u,
  armenian: /\p{Script=Armenian}/u,
  ethiopic: /\p{Script=Ethiopic}/u,
} satisfies Record<string, RegExp>

/** CLDR likely-subtags 文字系统 → 该文字系统下可能出现的 Unicode 文字。 */
const SCRIPTS_BY_CLDR_SCRIPT: Record<string, TextScript[]> = {
  Latn: ['latin'],
  Cyrl: ['cyrillic'],
  Grek: ['greek'],
  Arab: ['arabic'],
  Hebr: ['hebrew'],
  Hans: ['han'],
  Hant: ['han'],
  Hani: ['han'],
  Jpan: ['han', 'kana'],
  Kore: ['hangul', 'han'],
  Deva: ['devanagari'],
  Beng: ['bengali'],
  Taml: ['tamil'],
  Thai: ['thai'],
  Laoo: ['lao'],
  Khmr: ['khmer'],
  Mymr: ['myanmar'],
  Geor: ['georgian'],
  Armn: ['armenian'],
  Ethi: ['ethiopic'],
}

function dominantTextScript(text: string): TextScript | null {
  const counts = new Map<TextScript, number>()
  let total = 0
  for (const character of text) {
    for (const [script, pattern] of Object.entries(SCRIPT_CHARACTERS) as [TextScript, RegExp][]) {
      if (pattern.test(character)) {
        counts.set(script, (counts.get(script) ?? 0) + 1)
        total += 1
        break
      }
    }
  }
  if (total === 0)
    return null

  let dominant: TextScript | null = null
  let highest = 0
  for (const [script, count] of counts) {
    if (count > highest) {
      dominant = script
      highest = count
    }
  }
  return dominant
}

/**
 * 声明的语言是否与文本自相矛盾（例如中文正文被贴上 `LC-en` 标签）。
 *
 * 仅在能明确证伪时返回 false：文本的主流文字与声明语言使用的文字不符，或声明为中文却出现
 * 只属于日语的假名。语言未收录、文本没有可判定的文字时一律返回 true —— 这里只负责否定
 * 明显错误的元数据，真正的语言识别仍由浏览器探测负责。
 *
 * 注意：`Intl` 会把无法识别的语言代码回落到 Latn，因此未知代码 + CJK 正文会被否决；
 * 多文字系统的语言（如阿塞拜疆语）也可能被误否决。两种情况都只会「跳过翻译」，
 * 不会产出乱码，属于安全方向的误差。
 */
export function isTextPlausibleForLanguage(text: string, language?: string | null): boolean {
  const canonical = canonicalizeLanguage(language)
  if (!canonical || !text)
    return true

  let expected: TextScript[] | undefined
  try {
    const likelyScript = new Intl.Locale(canonical).maximize().script
    expected = likelyScript ? SCRIPTS_BY_CLDR_SCRIPT[likelyScript] : undefined
  }
  catch {
    expected = undefined
  }
  if (!expected)
    return true

  const dominant = dominantTextScript(text)
  if (!dominant)
    return true
  if (!expected.includes(dominant))
    return false

  // 假名只为日语使用：声明为中文时出现假名即可证伪（中日共用汉字，反向无法判定）
  if (!expected.includes('kana') && SCRIPT_CHARACTERS.kana.test(text))
    return false

  return true
}
