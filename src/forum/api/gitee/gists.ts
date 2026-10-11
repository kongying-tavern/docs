import type { ApiCallOptions } from './types'
import { apiCall } from '.'
import { parseGiteeGist, parseGiteeGists } from './contracts'

export type GistRequestOptions = Pick<ApiCallOptions, 'expectedSessionGeneration'>

export const FORUM_STATE_GIST_DESCRIPTION = 'Kongying Forum State'
export const FORUM_STATE_GIST_FILE = 'kongying-forum-state.json'
export const FORUM_STATE_BACKUP_DESCRIPTION = 'Kongying Forum State Backup'
export const FORUM_STATE_BACKUP_FILE = 'kongying-forum-state-backup.json'

export interface GiteeGistFile {
  content?: string
  filename?: string
  raw_url?: string
}

export interface GiteeGist {
  id: string | number
  description: string | null
  files: Record<string, GiteeGistFile>
  public: boolean
  updated_at?: string
  truncated?: boolean
}

function unwrapGist(data: GiteeGist | GiteeGist[]): GiteeGist {
  if (Array.isArray(data) && data.length !== 1)
    throw new Error('Gitee returned an ambiguous or empty gist response.')
  const gist = Array.isArray(data) ? data[0] : data
  if (!gist)
    throw new Error('Gitee returned an empty gist response.')
  return parseGiteeGist(gist, 'gists/detail')
}

export async function listGists({ page = 1, ...options }: GistRequestOptions & { page?: number } = {}): Promise<GiteeGist[]> {
  const { data } = await apiCall<GiteeGist[]>('get', 'gists', {
    ...options,
    searchParams: { page, per_page: 100 },
  })
  return parseGiteeGists(data)
}

export async function getGist(id: string, options: GistRequestOptions = {}): Promise<GiteeGist> {
  const { data } = await apiCall<GiteeGist | GiteeGist[]>('get', `gists/${id}`, options)
  return unwrapGist(data)
}

export async function createForumStateGist(content: string, options: GistRequestOptions = {}): Promise<GiteeGist> {
  const { data } = await apiCall<GiteeGist | GiteeGist[]>('post', 'gists', {
    ...options,
    json: {
      description: FORUM_STATE_GIST_DESCRIPTION,
      public: false,
      files: {
        [FORUM_STATE_GIST_FILE]: { content },
      },
    },
  })
  return unwrapGist(data)
}

export async function updateForumStateGist(id: string, content: string, options: GistRequestOptions = {}): Promise<GiteeGist> {
  const { data } = await apiCall<GiteeGist | GiteeGist[]>('patch', `gists/${id}`, {
    ...options,
    json: {
      description: FORUM_STATE_GIST_DESCRIPTION,
      public: false,
      files: {
        [FORUM_STATE_GIST_FILE]: { content },
      },
    },
  })
  return unwrapGist(data)
}

export async function createForumStateBackup(source: GiteeGist, options: GistRequestOptions = {}): Promise<GiteeGist> {
  const content = JSON.stringify({ version: 1, sourceGistId: String(source.id), savedAt: new Date().toISOString(), files: source.files }, null, 2)
  const { data } = await apiCall<GiteeGist | GiteeGist[]>('post', 'gists', {
    ...options,
    json: {
      description: FORUM_STATE_BACKUP_DESCRIPTION,
      public: false,
      files: { [FORUM_STATE_BACKUP_FILE]: { content } },
    },
  })
  const saved = unwrapGist(data)
  if (saved.public || saved.description !== FORUM_STATE_BACKUP_DESCRIPTION || saved.files[FORUM_STATE_BACKUP_FILE]?.content !== content)
    throw new Error('The forum personal state backup could not be verified.')
  return saved
}
