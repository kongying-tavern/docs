import { apiCall } from '.'

export const FORUM_STATE_GIST_DESCRIPTION = 'Kongying Forum State'
export const FORUM_STATE_GIST_FILE = 'kongying-forum-state.json'

export interface GiteeGistFile {
  content?: string
  filename?: string
  raw_url?: string
}

export interface GiteeGist {
  id: string | number
  description: string
  files: Record<string, GiteeGistFile>
  public: boolean
  updated_at?: string
}

function unwrapGist(data: GiteeGist | GiteeGist[]): GiteeGist {
  const gist = Array.isArray(data) ? data[0] : data
  if (!gist)
    throw new Error('Gitee returned an empty gist response.')
  return gist
}

export async function listGists(): Promise<GiteeGist[]> {
  const { data } = await apiCall<GiteeGist[]>('get', 'gists', {
    searchParams: { page: 1, per_page: 100 },
  })
  return data
}

export async function getGist(id: string): Promise<GiteeGist> {
  const { data } = await apiCall<GiteeGist | GiteeGist[]>('get', `gists/${id}`)
  return unwrapGist(data)
}

export async function createForumStateGist(content: string): Promise<GiteeGist> {
  const { data } = await apiCall<GiteeGist | GiteeGist[]>('post', 'gists', {
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

export async function updateForumStateGist(id: string, content: string): Promise<GiteeGist> {
  const { data } = await apiCall<GiteeGist | GiteeGist[]>('patch', `gists/${id}`, {
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
