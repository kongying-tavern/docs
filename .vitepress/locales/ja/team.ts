import type { CustomConfig } from '../types.ts'

const team: CustomConfig['team'] = {
  title: 'チームについて',
  desc: 'このマップは主に中国を拠点とするチームが制作しています。以下はメンバーの一部です。',
  heroAction: 'チームについて詳しく見る',
  memberCard: {
    sponsor: 'スポンサー',
    profilePicture: '{name} のプロフィール画像',
    projects: 'プロジェクト',
    location: '所在地',
    languages: '言語',
    website: 'ウェブサイト',
  },
  coreMember: {
    title: 'コアチームメンバー',
    desc: 'コアチームメンバーは、1 つ以上の主要プロジェクトを長期的に積極的に維持しているメンバーです。空蛍酒場のエコシステムに大きく貢献しています。',
  },
  emeritiMember: {
    title: '名誉コアチーム',
    desc: '過去に大きな貢献をし、現在は活動していない元チームメンバーに敬意を表します。',
  },
  partnerMember: {
    title: 'コミュニティパートナー',
    desc: '主要なパートナーとは緊密に連携し、今後の機能についてともに関わることが多くあります。',
  },
}

export default team
