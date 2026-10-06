import type { CustomConfig } from '../types'

const ui: CustomConfig['ui'] = {
  title: {
    templateMappings: [
      {
        test: /(^|\/?)manual\/client\/?/,
        template: ':title - Client Manuals | Kongying Tavern',
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
  sitemap: {
    blog: 'Blog Posts',
    manual: 'User Manual',
    general: 'General Pages',
    api: 'API Documentation',
    guide: 'Guides',
    community: 'Community',
    about: 'About Us',
  },
}

export default ui
