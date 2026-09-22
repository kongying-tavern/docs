import type { CustomConfig } from '../types'

const settings: CustomConfig['settings'] = {
  title: 'Settings',
  description: 'Adjust how the site looks and behaves in this browser. Changes are saved automatically.',
  back: 'Go back',
  copyFailed: 'Copy failed — try again or select the text manually',
  appearance: {
    title: 'Appearance',
    description: 'Choose how the site theme is displayed.',
    theme: 'Theme mode',
    themeDescription: 'Applies to documentation, feedback, and other site pages.',
    light: 'Light',
    dark: 'Dark',
    auto: 'System',
  },
  notifications: {
    title: 'Notifications',
    description: 'Adjust how page messages are displayed.',
    position: 'Position',
    positionDescription: 'Choose where notifications appear on the page.',
    duration: 'Duration',
    durationDescription: 'Choose how quickly notifications close, or keep them visible until dismissed.',
    fast: 'Fast',
    default: 'Default',
    slow: 'Slow',
    persistent: 'Persistent',
    previewMessage: 'This is a test notification',
    positions: {
      topLeft: 'Top left',
      topCenter: 'Top center',
      topRight: 'Top right',
      bottomLeft: 'Bottom left',
      bottomCenter: 'Bottom center',
      bottomRight: 'Bottom right',
    },
  },
  language: {
    title: 'Language and translation',
    description: 'Adjust how content in other languages is displayed.',
    excludedSourceLanguages: 'Languages not to auto-translate',
    excludedSourceLanguagesDescription: 'Keep the original when one of these languages is detected. Manual translation remains available.',
    searchLanguages: 'Search and select languages…',
    chooseLanguages: 'Choose languages',
    noLanguagesFound: 'No matching languages found',
    unavailable: 'Local translation of feedback is not supported by this browser.',
  },
  privacy: {
    title: 'Privacy and diagnostics',
    description: 'Manage diagnostic information used to investigate site problems.',
  },
}

export default settings
