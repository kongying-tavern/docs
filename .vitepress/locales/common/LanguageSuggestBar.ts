interface LanguageSuggestBar {
  changeLanguage: string
  continue: string
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
  },
  en: {
    changeLanguage: 'I want to change the language of this page to:',
    continue: 'Continue',
  },
  ja: {
    changeLanguage: 'このページの言語を変更したい: ',
    continue: '続ける',
  },
}
