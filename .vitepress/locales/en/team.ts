import type { CustomConfig } from '../types'

const team: CustomConfig['team'] = {
  title: '关于团队',
  desc: '地图的背后是一个基本来自中国的团队，以下是部分成员的个人信息。',
  coreMember: {
    title: '核心团队成员',
    desc: '核心团队成员是那些积极长期参与维护一个或多个核心项目的人。 他们对空荧酒馆的生态系统做出了重大贡献。',
  },
  emeritiMember: {
    title: '名誉核心团队',
    desc: '我们在此致敬过去曾做出过突出贡献的不再活跃的团队成员。',
  },
  partnerMember: {
    title: '社区伙伴',
    desc: '我们与这些主要合作伙伴建立了更加亲密的关系，经常与他们就即将到来的功能展开合作。',
  },
}

export default team
