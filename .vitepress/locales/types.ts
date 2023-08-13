export interface CustomConfig {
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
  payment?: Record<
    string,
    {
      name: string
      address: string
    }
  >
}
