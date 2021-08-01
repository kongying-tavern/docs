import type { ThemeData } from '@vuepress/plugin-theme-data/lib/client'

export type ThemeLocaleData = ThemeData<{
  download: string
  newFolder: string
  selectDownloadMethod: string
  stayTuned: string
  backToTop: string
  swipeRightToClose: string
  followUs: string
  grade: string
  feedback: string
  thankFeedback: string
  notSupportReplication: string
  copySuccess: string
  extractionCode: string
  sponsorship: sponsorship[]
}>

interface sponsorship {
  name: string
  logo: string
  link: string
  title?: string
}
