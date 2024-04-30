import type { CustomConfig } from '../types'

const docsFeedback: CustomConfig['docsFeedback'] = {
  feedbackMsg: 'Ce document vous a-t-il été utile?',
  good: 'Utile',
  bad: 'Pas utile',
  feedbackFailMsg:
    "Échec de la rétroaction, veuillez réessayer ou contacter l'administrateur (QQ : 1961266616)!",
  feedbackSuccessMsg: 'Rétroaction soumise avec succès, merci!',
  badFeedbackSuccessMsg: 'Veuillez spécifier les problèmes ci-dessous~',
  form: {
    chooseIssues: "Avez-vous rencontré l'un de ces problèmes?",
    translationIssue: 'Problème de traduction',
    typosIssue: 'Erreurs de frappe/ponctuation',
    ContentImgLinkIssue:
      "Contenu inexact, problème de chargement d'image ou de lien",
    feedbackDetail: 'Détails/Suggestions',
    feedbackTip: 'Décrivez les problèmes rencontrés ou les suggestions ici',
    otherIssue: 'Autres problèmes (spécifiez ci-dessous)',
    contactWay: 'Coordonnées (facultatif)',
    issueOptions: [
      { label: "Erreur d'affichage de page", value: 'pagedisplay-issue' },
      { label: 'Erreurs de frappe, ponctuation', value: 'typos-issue' },
      { label: 'Contenu, image, erreur de lien', value: 'content-issue' },
      { label: 'Autres problèmes', value: 'other-issue' },
    ],
  },
}

export default docsFeedback
