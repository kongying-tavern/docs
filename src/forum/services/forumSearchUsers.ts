export interface ForumSearchUser {
  id: string | number
  login: string
  username: string
  avatar: string
}

export interface ForumSearchUserLike {
  id: string | number
  login: string
  username: string
  avatar?: string
}

export interface ForumSearchUserGroup {
  id: 'recommended' | 'team'
  users: ForumSearchUser[]
}

export function getForumSearchUserGroups(
  loadedUsers: readonly ForumSearchUserLike[],
  teamMembers: readonly ForumSearchUserLike[],
  search = '',
): ForumSearchUserGroup[] {
  const recommended = uniqueUsers(loadedUsers)
  const recommendedLogins = new Set(recommended.map(user => normalizeLogin(user.login)))
  const team = uniqueUsers(teamMembers).filter(user => !recommendedLogins.has(normalizeLogin(user.login)))
  const query = search.trim().toLocaleLowerCase()
  const matches = (user: ForumSearchUser) => !query
    || user.username.toLocaleLowerCase().includes(query)
    || user.login.toLocaleLowerCase().includes(query)

  return [
    { id: 'recommended', users: recommended.filter(matches) },
    { id: 'team', users: team.filter(matches) },
  ]
}

function uniqueUsers(users: readonly ForumSearchUserLike[]): ForumSearchUser[] {
  const seen = new Set<string>()
  return users.flatMap((user) => {
    const login = user.login.trim()
    const key = normalizeLogin(login)
    if (!key || seen.has(key))
      return []
    seen.add(key)
    return [{
      id: user.id,
      login,
      username: user.username.trim() || login,
      avatar: user.avatar ?? '',
    }]
  })
}

function normalizeLogin(login: string): string {
  return login.trim().toLocaleLowerCase()
}
