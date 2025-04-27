import type { CustomConfig } from '../types'

const forum: CustomConfig['forum'] = {
  loadMore: '加载更多',
  noMore: '没有更多',
  loadError: '加载失败',
  exceededRateLimitWarning: '已达到 Gitee 接口的最大请求频率限制，请登录后重试',
  topic: {
    official: '官方',
    author: '作者',
    showMore: '显示更多',
    backToFeedbackForum: '返回反馈',
    menu: {
      giteeLink: '在Gitee查看',
      toOriginal: '转到原文',
      hideFeedback: {
        text: '隐藏反馈',
        success: '反馈隐藏成功',
        fail: '反馈隐藏失败',
      },
      deleteComment: {
        text: '删除评论',
        success: '评论删除成功',
        fail: '评论删除失败',
      },
      closeFeedback: {
        text: '关闭反馈',
        success: '反馈关闭成功',
        fail: '反馈关闭失败',
      },
      copyLink: {
        text: '复制链接',
        success: '已复制',
        fail: '复制失败',
      },
    },
    type: {
      sug: '提建议',
      bug: '提漏洞',
      feat: '我想要',
      ann: '公告',
    },
    state: {
      open: '已开启',
      closed: '已关闭',
      rejected: '已拒绝',
      progressing: '进行中',
    },
    backToTeamBlog: '返回团队博客',
    backToPrevPage: '返回上一页',
  },
  auth: {
    login: '登录',
    logout: '登出',
    loginMsg: '登录 Gitee 账号',
    logoutMsg: '登出 Gitee 账号',
    loginTips: '请登录后重试',
    loginToCheck: '请 %login 后查看 (・ω・)',
    jumpToGiteeTips: '即将跳转到 Gitee 进行授权登录',
    loginSuccess: '登录成功',
    logoutSuccess: '已登出',
    loginFail: '登录失败',
    logoutFail: '登出失败',
    loginAlert: '登录提示',
    loginAlertMsg: '即将跳转到 Gitee 进行授权登录',
    notGiteeAccountMsg: '没有 Gitee 账号？%signup',
    clickToGiteeSignup: '点击注册 Gitee 账号',
  },
  aside: {
    contactUs: {
      title: '联系我们',
      desc: '地图功能异常、紧急问题请加入QQ反馈群处理',
      qrcodeLink: 'https://jq.qq.com/?_wv=1027&k=nbveGrfQ',
    },
    teamBlog: {
      text: '团队博客',
      items: [
        {
          text: '原神地图客户端更新日志',
          link: '/blog/hotupdatelog-client',
        },
        {
          text: '原神地图网页版更新日志',
          link: '/blog/changelog-web',
        },
      ],
    },
    suggest: {
      text: '相关推荐',
      items: [],
    },
    info: [
      {
        text: '反馈由 Gitee 提供技术支持',
        link: 'https://gitee.com',
      },
    ],
  },
  comment: {
    comment: '评论',
    commentSuccess: '评论成功：',
    commentFail: '评论失败：',
    commentAfterLogin: '请 %login 后发表评论 (・ω・)',
    commentCount: '评论',
    placeholder: '发表你的评论吧~',
    loadMoreComment: '加载更多评论',
    noComment: '暂无评论',
    noMoreComment: '没有更多评论',
    loadingComment: '评论加载中...',
    reply: '回复',
    commentsClosed: '评论关闭',
  },
  header: {
    sort: {
      created: '最近创建',
      updated: '最近更新',
      notesCount: '评论数正序',
    },
    search: {
      placeholder: '搜索反馈',
      allRelatedContentCount: '搜索到相关反馈数',
    },
    navigation: {
      allFeedback: '全部反馈',
      bugFeedback: '问题反馈',
      featFeedback: '功能建议',
      closedFeedback: '已结反馈',
      faq: {
        title: '常见问题',
        items: [
          {
            text: 'Alert Dialog',
            link: '/docs/components/alert-dialog',
            desc: 'A modal dialog that interrupts the user with important content and expects a response.',
          },
        ],
      },
    },
  },
  publish: {
    tags: {
      issue: {
        typos: '错别字',
        display: '显示问题',
        login: '登录问题',
        performance: '性能问题',
        translation: '翻译问题',
        other: '其他问题',
        pin: '点位问题',
        docs: '文档问题',
      },
      platforms: {
        all: '全平台可复现',
        web: '网页端问题',
        client: '客户端问题',
      },
    },
    title: '提交反馈',
    type: {
      sug: '提建议',
      bug: '提缺陷',
      feat: '我想要',
      ann: '发公告',
    },
    tagsInput: {
      searchTags: '搜索符合的标签',
      maxTagsLimit: '已达到最大可选标签数量',
      noResultsFound: '没有符合的结果',
    },
    publishSuccess: '反馈上传成功：',
    publishFail: '反馈上传失败：',
    publishLoading: '反馈提交中',
    form: {
      title: {
        text: '标题',
        placeholder: '请输入标题（5-50个字）',
      },
      type: {
        text: '标签',
        placeholder: '请选择反馈类型（需至少选择一个）',
      },
      content: {
        text: '反馈内容',
        placeholder: '请详细描述你的反馈内容（5-2000字）',
      },
      upload: {
        text: '上传错误截图',
        tip: '请上传相关错误截图或报错信息最多 %range 张，最大不超过 %size MB',
        fail: '%filename 上传失败',
        violation: '图片违规！请勿上传任何与反馈无关的图片',
      },
    },
  },
  user: {
    menu: {
      giteePage: 'Gitee 个人主页',
      giteeAccountInfo: 'Gitee 账号信息',
    },
    myFeedback: {
      title: '我的反馈',
    },
  },
  readMore: '了解更多',
  translate: {
    translateText: '翻译贴子',
    translateInfo: '翻译由 Meta Seq2Seq 模型提供支持',
    error: '翻译失败',
    limit: '已达到最大请求次数，请稍后再试',
    loading: '翻译中...',
  },
}

export default forum
