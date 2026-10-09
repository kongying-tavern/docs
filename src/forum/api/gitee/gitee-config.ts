import type ForumAPI from '../types'

export const GITEE_API_CONFIG = {
  BASE_URL: 'https://gitee.com',
  CLIENT_ID: '46b7428ff4cbeea6bde978240479c56dd51ef5220fb7574d1c9715b16217c1d2',
  CLIENT_SECRET:
    'f29771984bc886244ddbad55e319dc7adbd973139e133569fea3799a5b631695',
  OWNER: 'KYJGYSDT',
  FEEDBACK_REPO: 'Feedback',
  BLOG_REPO: 'Blog',
  TOPIC_TYPE: ['BUG', 'FEAT', 'ANN'],
  STATE_TAGS: new Set(['DEV-TEST', 'WEB-FEEDBACK', 'GOOD-ISSUE', 'PINNED', 'COMMENT-CLOSED']),
} as const

/**
 * `change_issue_state` 操作日志的 before/after 记录的是状态**显示名**而非
 * `state` 的 token，`issue_state` 字段同样是显示名。内置状态与 `TopicState`
 * 的对应关系如下；企业自定义状态无法穷举，故调用方需保留原文兜底。
 */
export const GITEE_ISSUE_STATE_TITLES: Record<string, ForumAPI.TopicState> = {
  待办的: 'open',
  进行中: 'progressing',
  已完成: 'closed',
}

export const GITEE_AUTH_SCOPES = ['user_info', 'issues', 'notes', 'gists'] as const
