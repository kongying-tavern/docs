interface LanguageSuggestBar {
  changeLanguage: string
  continue: string
  ariaLabel: string
}

export interface LanguageSuggestBarTranslate {
  root: LanguageSuggestBar
  en: LanguageSuggestBar
  ja: LanguageSuggestBar
}

export const languageSuggestBarTranslate: LanguageSuggestBarTranslate = {
  root: {
    changeLanguage: '我想更改此页面的语言为：',
    continue: '继续',
    ariaLabel: '选择国家或地区',
  },
  en: {
    changeLanguage: 'I want to change the language of this page to:',
    continue: 'Continue',
    ariaLabel: 'Choose country or region',
  },
  ja: {
    changeLanguage: 'このページの言語を変更：',
    continue: '続ける',
    ariaLabel: '国または地域を選択',
  },
}
