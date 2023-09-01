export interface CustomConfig {
  keyword: string
  description: string
  image: string
  footer: {
    qrcodeTitle: string
    qrcodeMessage: string
    qrcodeLink: string
    navigation: {
      title: string
      items: {
        text: string
        link: string
      }[]
    }[]
  }
  team: {
    title: string
    desc: string
    coreMember: {
      title: string
      desc: string
    }
    emeritiMember: {
      title: string
      desc: string
    }
    partnerMember: {
      title: string
      desc: string
    }
  }
  payment?: Record<
    string,
    {
      name: string
      address: string
    }
  >
}
