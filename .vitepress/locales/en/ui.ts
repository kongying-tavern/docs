import type { CustomConfig } from '../types.ts'

const ui: CustomConfig['ui'] = {
  title: {
    templateMappings: [
      {
        test: /(^|\/?)manual\/client\/?/,
        template: ':title - Client user manual | Kongying Tavern',
      },
    ],
  },
  banner: {
    wip: 'The translation for this page is still in progress.',
  },
  chunkLoadRecovery: {
    description: 'Some content could not load. The connection may have failed or the page may have been updated. Save any unsent content, then check your connection and reload.',
    reload: 'Reload page',
    later: 'Later',
  },
  button: {
    submit: 'Submit',
    cancel: 'Cancel',
    loading: 'Loading',
    search: 'Search',
    close: 'Close',
    all: 'All',
    emoji: 'Emoji',
  },
  labelSeparator: ': ',
  payment: {
    addressLabel: 'Payment address',
    qrcodeAlt: '{name} QR code',
  },
  sitemap: {
    blog: 'Blog posts',
    manual: 'User manual',
    general: 'General pages',
    api: 'API documentation',
    guide: 'Guides',
    community: 'Community',
    about: 'About us',
  },
}

export default ui
