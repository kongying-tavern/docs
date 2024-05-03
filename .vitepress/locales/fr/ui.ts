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
    wip: 'Cette page est en cours de maintenance et ne représente pas le résultat final.',
  },
  button: {
    submit: 'Soumettre',
    cancel: 'Annuler',
  },
}

export default ui
