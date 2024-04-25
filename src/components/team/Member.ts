export interface Member {
  name: string
  qq: string
  avatarPic?: string
  title: string
  company?: string
  companyLink?: string
  projects: Link[]
  location: string
  languages: string[]
  website?: Link
  socials: Socials
  sponsor?: boolean | string
  reposPersonal?: string[]
}

export interface Link {
  label: string
  url: string
}

export interface Socials {
  [x: string]: unknown
  github: string
  twitter?: string
  bilibili?: string
}
