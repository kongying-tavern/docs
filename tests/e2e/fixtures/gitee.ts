import { parseGiteeComment, parseGiteeIssue, parseGiteeUser } from '../../../src/forum/api/gitee/contracts'

// Synthetic raw provider data, validated with the production parsers. No captured credentials.
// Field shapes follow the Gitee list/comment GET samples reviewed on 2026-10-04.
export const alice = parseGiteeUser({
  id: 7,
  login: 'alice',
  name: 'Alice',
  avatar_url: '',
  html_url: 'https://gitee.com/alice',
  created_at: '2023-05-01T00:00:00+08:00',
}, 'fixture/users/alice')

export const currentUser = parseGiteeUser({ ...alice, id: 99, login: 'current-user', name: 'CurrentUser', html_url: 'https://gitee.com/current-user' }, 'fixture/user')

export function issue(overrides: Partial<Omit<GITEE.IssueInfo, 'labels'>> & { labels?: { name: string }[] } = {}): GITEE.IssueInfo {
  const number = overrides.number ?? '123'
  return parseGiteeIssue({
    id: 900001,
    number,
    html_url: `https://gitee.com/KYJGYSDT/Feedback/issues/${number}`,
    title: 'FEAT:测试反馈路由可用',
    state: 'open',
    user: alice,
    assignee: null,
    labels: [{ name: 'TYP-FEAT' }],
    comments: 1,
    created_at: '2026-08-01T10:00:00+08:00',
    updated_at: '2026-08-02T10:00:00+08:00',
    body: '正文内容：这是一条用于浏览器冒烟测试的反馈。',
    ...overrides,
  }, 'fixture/issues')
}

export function comment(overrides: Partial<GITEE.Comment> = {}, topic = issue()): GITEE.Comment {
  return parseGiteeComment({
    id: 99001,
    body: '这是一条评论。',
    user: alice,
    created_at: '2026-08-01T12:00:00+08:00',
    updated_at: '2026-08-01T12:00:00+08:00',
    target: { issue: { id: topic.id, number: topic.number } },
    ...overrides,
  }, 'fixture/comments')
}

export function localAuth(): string {
  return JSON.stringify({
    accessToken: 'synthetic-e2e-token',
    refreshToken: 'synthetic-e2e-refresh',
    createdAt: Date.now(),
    expiresIn: 86400,
    expiresTime: Date.now() + 86400_000,
    scope: 'user_info',
    tokenType: 'bearer',
  })
}
