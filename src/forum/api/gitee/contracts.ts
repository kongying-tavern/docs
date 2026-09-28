import { z } from 'zod'

const userSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string(),
  avatar_url: z.string(),
  html_url: z.string(),
})

const issueSchema = z.object({
  id: z.number().optional(),
  number: z.string(),
  state: z.enum(['open', 'closed', 'progressing']),
  title: z.string(),
  body: z.string(),
  html_url: z.string(),
  comments: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  finished_at: z.string().nullable().optional(),
  user: userSchema.nullish(),
  assignee: userSchema.nullish(),
  labels: z.array(z.object({ name: z.string() }).nullable()).nullish(),
})

const commentSchema = z.object({
  id: z.number(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string().nullish(),
  in_reply_to_id: z.union([z.string(), z.number()]).nullish(),
  user: userSchema.nullish(),
  target: z.object({ issue: z.object({ id: z.number() }).nullish() }).nullish(),
})

const authSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  created_at: z.number(),
  expires_in: z.number(),
  scope: z.string(),
  token_type: z.string(),
})

/** 校验实际消费的字段，保留上游原始对象与未使用字段。 */
function validate<T>(schema: z.ZodType, value: unknown, endpoint: string): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new Error(`Invalid Gitee response from ${endpoint}: ${z.prettifyError(result.error)}`)
  }
  return value as T
}

export function parseGiteeIssue(value: unknown, endpoint: string): GITEE.IssueInfo {
  return validate(issueSchema, value, endpoint)
}

export function parseGiteeIssues(value: unknown, endpoint: string): GITEE.IssueList {
  return validate(z.array(issueSchema), value, endpoint)
}

export function parseGiteeComment(value: unknown, endpoint: string): GITEE.Comment {
  return validate(commentSchema, value, endpoint)
}

export function parseGiteeComments(value: unknown, endpoint: string): GITEE.CommentList {
  return validate(z.array(commentSchema), value, endpoint)
}

export function parseGiteeUser(value: unknown, endpoint: string): GITEE.User {
  return validate(userSchema, value, endpoint)
}

export function parseGiteeUsers(value: unknown, endpoint: string): GITEE.User[] {
  return validate(z.array(userSchema), value, endpoint)
}

export function parseGiteeAuth(value: unknown): GITEE.Auth {
  return validate(authSchema, value, 'oauth/token')
}
