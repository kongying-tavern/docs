interface Info {
  title: string
  desc?: string
}

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
  staff: {
    title: string
    desc: string
    clientStaff: Info
    webStaff: Info
    pinStaff: Info
    translateStaff: Info
    communityStaff: Info
  }
  team: {
    title: string
    desc: string
    coreMember: Info
    emeritiMember: Info
    partnerMember: Info
  }
  asideLinks: {
    title: string
    starOnGitHub: string
    contactUsText: string
    contactUsLink: string
    sponsor: string
    editLink: string
    translateThisPage: string
  }
  payment?: Record<
    string,
    {
      name: string
      address: string
    }
  >
  ui: {
    title: {
      templateMappings: {
        test: RegExp
        template: string
      }[]
    }
    banner: {
      wip: string
    }
    button: {
      search: string
      submit: string
      cancel: string
      loading: string
      close: string
      all: string
    }
  }
  docReaction: {
    feedbackMsg: string
    good: string
    bad: string
    badFeedbackSuccessMsg: string
    feedbackFailMsg: string
    feedbackSuccessMsg: string
    form: {
      chooseIssues: string
      translationIssue: string
      typosIssue: string
      contentImgLinkIssue: string
      feedbackDetail: string
      feedbackTip: string
      otherIssue: string
      contactWay: string
      issueOptions: {
        label: string
        value: string
      }[]
    }
  }
  forum: {
    loadMore: string
    readMore: string
    noMore: string
    loadError: string
    exceededRateLimitWarning: string
    translate: {
      translateText: string
      translateInfo: string
      loading: string
      error: string
      limit: string
    }
    user: {
      menu: {
        giteePage: string
        giteeAccountInfo: string
      }
      myFeedback: {
        title: string
      }
    }
    topic: {
      official: string
      author: string
      showMore: string
      backToFeedbackForum: string
      backToTeamBlog: string
      backToPrevPage: string
      state: {
        open: string
        closed: string
        rejected: string
        progressing: string
      }
      type: {
        sug: string
        bug: string
        feat: string
        ann?: string
      }
      menu: {
        giteeLink: string
        toOriginal: string
        hideFeedback: {
          text: string
          success: string
          fail: string
        }
        deleteComment: {
          text: string
          success: string
          fail: string
        }
        closeFeedback: {
          text: string
          success: string
          fail: string
        }
        copyLink: {
          text: string
          success: string
          fail: string
        }
      }
    }
    auth: {
      login: string
      logout: string
      loginMsg: string
      logoutMsg: string
      loginTips: string
      loginToCheck: string
      jumpToGiteeTips: string
      loginSuccess: string
      logoutSuccess: string
      loginFail: string
      logoutFail: string
      loginAlert: string
      loginAlertMsg: string
      notGiteeAccountMsg: string
      clickToGiteeSignup: string
    }
    aside: {
      contactUs: {
        title: string
        desc: string
        qrcodeLink: string
      }
      teamBlog: {
        text: string
        items: {
          cover?: string
          text: string
          link: string
        }[]
      }
      suggest: {
        text: string
        items: {
          text: string
          tag: string
          link: string
        }[]
      }
      info: {
        text: string
        link: string
        alt?: string
      }[]
    }
    comment: {
      comment: string
      commentSuccess: string
      commentFail: string
      commentAfterLogin: string
      commentCount: string
      placeholder: string
      noMoreComment: string
      loadMoreComment: string
      noComment: string
      loadingComment: string
      reply: string
      commentsClosed: string
    }
    header: {
      sort: {
        created: string
        updated: string
        notesCount: string
      }
      search: {
        placeholder: string
        allRelatedContentCount: string
      }
      navigation: {
        allFeedback: string
        bugFeedback: string
        featFeedback: string
        closedFeedback: string
        faq: {
          title: string
          items: {
            text: string
            desc: string
            link: string
          }[]
        }
      }
    }
    publish: {
      title: string
      publishSuccess: string
      publishFail: string
      publishLoading: string
      tags: {
        issue: {
          typos: string
          display: string
          login: string
          performance: string
          translation: string
          other: string
          pin: string
          docs: string
        }
        platforms: {
          all: string
          web: string
          client: string
        }
      }
      type: {
        sug: string
        bug: string
        feat: string
        ann: string
      }
      tagsInput: {
        searchTags: string
        maxTagsLimit: string
        noResultsFound: string
      }
      form: {
        title: {
          text: string
          placeholder: string
        }
        type: {
          text: string
          placeholder: string
        }
        content: {
          text: string
          placeholder: string
        }
        upload: {
          text: string
          tip: string
          fail: string
          violation: string
        }
      }
    }
  }
  changelog: {
    title: string
    reportIssues: string
    feedbackPage: string
    changeType: {
      features: string
      fixed: string
      optimized: string
      breaking: string
    }
    action: {
      download: string
      community: string
    }
  }
}

export interface CustomConstant {
  META_URL: string
  META_TITLE: string
  META_KEYWORDS: string
  META_DESCRIPTION: string
  META_IMAGE: string
  LOCAL_CODE: string
  LOCAL_BASE: string
}
