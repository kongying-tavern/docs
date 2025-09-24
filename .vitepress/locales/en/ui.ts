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
    wip: 'Sorry, this page translation is still in progress.',
  },
  button: {
    submit: 'Submit',
    cancel: 'Cancel',
    loading: 'Loading',
    search: 'Search',
    close: 'Close',
    all: 'All',
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
