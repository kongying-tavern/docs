import type { DefaultTheme } from 'vitepress'

export const localeSearchConfig: DefaultTheme.LocalSearchOptions = {
  translations: {
    button: {
      buttonText: '搜索',
      buttonAriaLabel: '搜索',
    },
    modal: {
      noResultsText: '无法找到相关结果',
      resetButtonTitle: '清除查询条件',
      footer: {
        selectText: '选择',
        navigateText: '切换',
      },
    },
  },
  locales: {
    en: {
      translations: {
        button: {
          buttonText: 'Search',
          buttonAriaLabel: 'Search',
        },
        modal: {
          noResultsText: 'No results for',
          resetButtonTitle: 'Reset search',
          footer: {
            selectText: 'to select',
            navigateText: 'to navigate',
          },
        },
      },
    },
    fr: {
      translations: {
        button: {
          buttonText: 'Recherche',
          buttonAriaLabel: 'Recherche',
        },
        modal: {
          noResultsText: 'Aucun résultat pour',
          resetButtonTitle: 'Réinitialiser la recherche',
          footer: {
            selectText: 'pour sélectionner',
            navigateText: 'naviguer',
          },
        },
      },
    },
    ja: {
      translations: {
        button: {
          buttonText: '検索',
          buttonAriaLabel: '検索',
        },
        modal: {
          noResultsText: '結果はありません',
          resetButtonTitle: '検索をリセットする',
          footer: {
            selectText: '選ぶ',
            navigateText: '切り替える',
          },
        },
      },
    },
  },
}
