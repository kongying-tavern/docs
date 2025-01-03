import type { CustomConfig } from '../types'

const forum: CustomConfig['forum'] = {
  loadMore: 'Load More',
  noMore: 'No More',
  loadError: 'Load Error',
  topic: {
    official: 'Official',
    author: 'Author',
    menu: {
      giteeLink: 'Gitee Link',
      hideFeedback: {
        text: 'Hide Feedback',
        success: 'Feedback Hidden',
        fail: 'Failed to Hide Feedback',
      },
      deleteComment: {
        text: 'Delete Comment',
        success: 'Comment Deleted',
        fail: 'Failed to Delete Comment',
      },
      closeFeedback: {
        text: 'Close Feedback',
        success: 'Feedback Closed',
        fail: 'Failed to Close Feedback',
      },
    },
    type: {
      sug: 'Suggestion',
      bug: 'Bug',
      feat: 'Feature',
      ann: 'Announcement',
    },
    state: {
      open: 'Open',
      closed: 'Closed',
      rejected: 'Rejected',
      progressing: 'In Progress',
    },
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    loginMsg: 'Login with Gitee',
    logoutMsg: 'Logout from Gitee',
    loginTips: 'Please login and try again',
    loginToCheck: 'Please %login to view (・ω・)',
    jumpToGiteeTips: 'Redirecting to Gitee for login',
    loginSuccess: 'Login Successful',
    logoutSuccess: 'Logged Out',
    loginFail: 'Login Failed',
    logoutFail: 'Logout Failed',
    loginAlert: 'Login Alert',
    loginAlertMsg: 'Redirecting to Gitee for login',
    notGiteeAccountMsg: 'No Gitee Account? %signup',
    clickToGiteeSignup: 'Sign up for Gitee',
  },
  aside: {
    contactUs: {
      title: 'Contact Us',
      desc: 'Join the QQ group for urgent issues or map problems',
      qrcodeLink: 'https://jq.qq.com/?_wv=1027&k=nbveGrfQ',
    },
    teamBlog: {
      text: 'Team Blog',
      items: [
        {
          text: 'Genshin Map Client Update Log',
          link: '#',
        },
        {
          text: 'Genshin Map Web Update Log',
          link: '#',
        },
      ],
    },
    suggest: {
      text: 'Recommended',
      items: [],
    },
    info: [
      {
        text: 'Feedback powered by Gitee',
        link: 'https://gitee.com',
      },
    ],
  },
  comment: {
    comment: 'Comment',
    commentSuccess: 'Comment Posted:',
    commentFail: 'Failed to Post Comment:',
    commentAfterLogin: 'Please %login to comment (・ω・)',
    commentCount: 'Comments',
    placeholder: 'Share your thoughts~',
    loadMoreComment: 'Load More Comments',
    noComment: 'No Comments',
    noMoreComment: 'No More Comments',
    loadingComment: 'Loading Comments...',
    reply: 'Reply',
    commentsClosed: 'Comments Closed',
  },
  header: {
    sort: {
      created: 'Creation Date',
      updated: 'Recently Updated',
      notesCount: 'Comments Count',
    },
    search: {
      placeholder: 'Search Feedback',
      allRelatedContentCount: 'Feedback Found',
    },
    navigation: {
      allFeedback: 'All Feedback',
      bugFeedback: 'Bug Feedback',
      featFeedback: 'Feature Suggestions',
      faq: {
        title: 'FAQ',
        items: [
          {
            text: 'Alert Dialog',
            link: '/docs/components/alert-dialog',
            desc: 'A modal dialog for important content requiring a response.',
          },
        ],
      },
    },
  },
  publish: {
    tags: {
      issue: {
        typos: 'Typos',
        display: 'Display Issue',
        login: 'Login Issue',
        performance: 'Performance Issue',
        translation: 'Translation Issue',
        other: 'Other Issues',
        pin: 'Pin Issue',
        docs: 'Documentation Issue',
      },
      platforms: {
        all: 'Reproducible on All Platforms',
        web: 'Web Issue',
        client: 'Client Issue',
      },
    },
    title: 'Publish Feedback',
    type: {
      sug: 'Suggestion',
      bug: 'Bug',
      feat: 'Feature',
      ann: 'Announcement',
    },
    tagsInput: {
      searchTags: 'Search Tags',
      maxTagsLimit: 'Tag Limit Reached',
      noResultsFound: 'No Results Found',
    },
    publishSuccess: 'Feedback Uploaded:',
    publishFail: 'Feedback Upload Failed:',
    publishLoading: 'Submitting Feedback',
    form: {
      title: {
        text: 'Title',
        placeholder: '',
      },
      type: {
        text: 'Label',
        placeholder: '',
      },
      content: {
        text: 'Feedback Content',
        placeholder: '',
      },
      upload: {
        tip: 'Upload up to %range images, max %size MB each',
        fail: '%filename Upload Failed',
        violation: 'Image Violation! Do not upload unrelated images.',
      },
    },
  },
  user: {
    menu: {
      giteePage: 'Gitee Profile',
      giteeAccountInfo: 'Gitee Account Info',
    },
    myFeedback: {
      title: 'My Feedback',
    },
  },
}

export default forum
