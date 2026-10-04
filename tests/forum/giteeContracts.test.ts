/* eslint-disable test/no-import-node-test -- use Node's built-in runner for this contract */
import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  parseGiteeAuth,
  parseGiteeComment,
  parseGiteeComments,
  parseGiteeIssue,
  parseGiteeIssues,
  parseGiteeUser,
  parseGiteeUsers,
} from '../../src/forum/api/gitee/contracts'
import { extractOfficialAndAuthorComments } from '../../src/forum/api/gitee/officialComments'

const user = {
  id: 1,
  login: 'alice',
  name: 'Alice',
  avatar_url: 'https://example.com/avatar.png',
  html_url: 'https://gitee.com/alice',
  extra: 'preserved',
}

const issue = {
  number: 'I1',
  state: 'open',
  title: 'BUG: Example',
  body: 'Body',
  html_url: 'https://gitee.com/issues/I1',
  comments: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  extra: 'preserved',
}

const comment = {
  id: 42,
  body: 'Reply',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  user,
}

test('core Gitee responses retain extra fields and optional issue fields', () => {
  assert.equal(parseGiteeIssue(issue, 'issues/I1'), issue)
  assert.equal(parseGiteeIssues([issue], 'issues')[0], issue)
  assert.equal(parseGiteeComment(comment, 'comments'), comment)
  assert.equal(parseGiteeComments([comment], 'comments')[0], comment)
  assert.equal(parseGiteeUser(user, 'user'), user)
  assert.equal(parseGiteeUsers([user], 'users')[0], user)
})

test('malformed successful Gitee responses fail before normalization', () => {
  assert.throws(() => parseGiteeIssue({ errors: ['failed'] }, 'issues/I1'), /Invalid Gitee response from issues\/I1/)
  assert.throws(() => parseGiteeIssues({ message: 'failed' }, 'issues'), /Invalid Gitee response from issues/)
  assert.throws(() => parseGiteeComments([{ ...comment, body: null }], 'comments'), /Invalid Gitee response from comments/)
  assert.throws(() => parseGiteeUser({ ...user, id: '1' }, 'user'), /Invalid Gitee response from user/)
})

test('related comments ignore provider rows without usable association or author', () => {
  const sourceIssue = { ...issue, id: 100, user }
  const comments = [
    { ...comment, target: undefined },
    { ...comment, id: 43, user: undefined, target: { issue: { id: 100 } } },
  ]
  assert.deepEqual(
    extractOfficialAndAuthorComments(
      parseGiteeIssue(sourceIssue, 'issues/I1'),
      parseGiteeComments(comments, 'issues/comments'),
      () => true,
    ),
    null,
  )
})

test('OAuth token responses require usable token fields', () => {
  const auth = {
    access_token: 'access',
    refresh_token: 'refresh',
    created_at: 1,
    expires_in: 3600,
    scope: 'user_info',
    token_type: 'bearer',
  }
  assert.equal(parseGiteeAuth(auth), auth)
  assert.throws(() => parseGiteeAuth({ ...auth, access_token: '' }), /Invalid Gitee response from oauth\/token/)
})
