import type { CustomConfig } from '../types'

const forum: CustomConfig['forum'] = {
  loadMore: 'もっと読む',
  noMore: 'これ以上ありません',
  loadError: '読み込み失敗',
  exceededRateLimitWarning:
    'Gitee APIの最大リクエストレート制限に達しました。ログインして再試行してください',

  translate: {
    translateText: '翻訳',
    translateInfo: '翻訳は Meta Seq2Seq モデルによって提供されています',
    error: '翻訳に失敗しました',
    limit: '最大リクエスト数に達しました',
    loading: '翻訳中...',
  },
  topic: {
    official: '公式',
    author: '作成者',
    showMore: 'もっと見る',
    backToFeedbackForum: 'フォーラムに戻る',
    menu: {
      giteeLink: 'Giteeリンク',
      toOriginal: '元のテキストに移動',
      hideFeedback: {
        text: 'フィードバックを隠す',
        success: '隠しました',
        fail: '隠すのに失敗しました',
      },
      deleteComment: {
        text: 'コメントを削除',
        success: '削除しました',
        fail: '削除に失敗しました',
      },
      closeFeedback: {
        text: 'フィードバックを閉じる',
        success: '閉じました',
        fail: '閉じるのに失敗しました',
      },
      copyLink: {
        text: 'リンクをコピー',
        success: 'コピーされました',
        fail: 'コピーに失敗しました',
      },
    },
    type: {
      sug: '提案',
      bug: 'バグ',
      feat: '機能',
      ann: 'お知らせ',
    },
    state: {
      open: '開放中',
      closed: '閉鎖中',
      rejected: '却下',
      progressing: '進行中',
    },
    backToTeamBlog: 'ブログに戻る',
    backToPrevPage: '前のページに戻る',
  },
  auth: {
    login: 'ログイン',
    logout: 'ログアウト',
    loginMsg: 'Giteeでログイン',
    logoutMsg: 'Giteeからログアウト',
    loginTips: 'ログインして再試行',
    loginToCheck: '%login して確認 (・ω・)',
    jumpToGiteeTips: 'Giteeで認証します',
    loginSuccess: 'ログイン成功',
    logoutSuccess: 'ログアウト完了',
    loginFail: 'ログイン失敗',
    logoutFail: 'ログアウト失敗',
    loginAlert: 'ログイン通知',
    loginAlertMsg: 'Giteeで認証',
    notGiteeAccountMsg: 'Giteeアカウントがない？%signup',
    clickToGiteeSignup: 'Gitee登録',
  },
  aside: {
    contactUs: {
      title: 'お問い合わせ',
      desc: '地図機能の不具合や緊急問題はQQグループにご連絡ください',
      qrcodeLink: 'https://jq.qq.com/?_wv=1027&k=nbveGrfQ',
    },
    teamBlog: {
      text: 'チームブログ',
      items: [
        {
          text: '原神マップクライアント更新ログ',
          link: '#',
        },
        {
          text: '原神マップウェブ版更新ログ',
          link: '#',
        },
      ],
    },
    suggest: {
      text: 'おすすめ',
      items: [],
    },
    info: [
      {
        text: 'Gitee技術サポート提供',
        link: 'https://gitee.com',
      },
    ],
  },
  comment: {
    comment: 'コメント',
    commentSuccess: 'コメント成功：',
    commentFail: 'コメント失敗：',
    commentAfterLogin: '%login してコメントしてください (・ω・)',
    commentCount: 'コメント',
    placeholder: 'コメントを入力してください~',
    loadMoreComment: 'もっと読む',
    noComment: 'コメントがありません',
    noMoreComment: 'これ以上コメントはありません',
    loadingComment: 'コメント読み込み中...',
    reply: '返信',
    commentsClosed: 'コメントは閉じられました',
  },
  header: {
    sort: {
      created: '作成日',
      updated: '更新日',
      notesCount: 'コメント数',
    },
    search: {
      placeholder: 'Search',
      allRelatedContentCount: '件の関連フィードバック',
    },
    navigation: {
      allFeedback: '全フィードバック',
      bugFeedback: 'バグ報告',
      featFeedback: '機能提案',
      closedFeedback: '終了済み',
      faq: {
        title: 'よくある質問',
        items: [
          {
            text: 'アラートダイアログ',
            link: '/docs/components/alert-dialog',
            desc: '重要な内容を通知し、応答を要求するモーダルダイアログ。',
          },
        ],
      },
    },
  },
  publish: {
    tags: {
      issue: {
        typos: '誤字',
        display: '表示問題',
        login: 'ログイン問題',
        performance: 'パフォーマンス問題',
        translation: '翻訳問題',
        other: 'その他',
        pin: 'ピンの問題',
        docs: 'ドキュメント問題',
      },
      platforms: {
        all: '全プラットフォームで再現可能',
        web: 'ウェブ版の問題',
        client: 'クライアント版の問題',
      },
    },
    title: 'フィードバックを投稿',
    type: {
      sug: '提案',
      bug: 'バグ',
      feat: '機能',
      ann: 'お知らせ',
    },
    tagsInput: {
      searchTags: 'タグを検索',
      maxTagsLimit: 'タグの上限に達しました',
      noResultsFound: '該当なし',
    },
    publishSuccess: 'フィードバック送信成功：',
    publishFail: 'フィードバック送信失敗：',
    publishLoading: '送信中...',
    form: {
      title: {
        text: 'タイトル',
        placeholder: '',
      },
      type: {
        text: 'ラベル',
        placeholder: '',
      },
      content: {
        text: '内容',
        placeholder: '',
      },
      upload: {
        text: 'エラーのスクリーンショットをアップロードする',
        tip: '%range 枚までのスクリーンショットをアップロード (最大 %size MB)',
        fail: '%filename アップロード失敗',
        violation:
          '不適切な画像！関連のない画像はアップロードしないでください。',
      },
    },
  },
  user: {
    menu: {
      giteePage: 'Giteeプロフィール',
      giteeAccountInfo: 'Giteeアカウント情報',
    },
    myFeedback: {
      title: '私のフィードバック',
    },
  },
  readMore: 'もっと詳しく知る',
}

export default forum
