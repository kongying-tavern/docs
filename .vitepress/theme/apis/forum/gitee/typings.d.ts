declare namespace GITEE {
  interface Auth {
    access_token: string
    created_at: number
    expires_in: number
    refresh_token: string
    scope: string
    token_type: string
  }

  interface User {
    id: number
    login: string
    name: string
    avatar_url: string
    url: string
    html_url: string
    remark: string | null
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    bio?: string
    created_at?: string
    updated_at?: string
    email?: string
    type: string
  }

  interface UserInfo {
    avatar_url: string
    bio: string
    blog: string
    created_at: string
    email: string
    events_url: string
    followers: integer
    followers_url: string
    following: integer
    following_url: string
    gists_url: string
    html_url: string
    id: integer
    login: string
    member_role: string
    name: string
    organizations_url: string
    public_gists: integer
    public_repos: integer
    received_events_url: string
    remark: string
    repos_url: string
    stared: integer
    starred_url: string
    subscriptions_url: string
    type: string
    updated_at: string
    url: string
    watched: integer
    weibo: string
  }

  interface IssueInfo {
    id: number
    url: string
    repository_url: string
    labels_url: string
    comments_url: string
    html_url: string
    parent_url: string | null
    number: string
    parent_id: number
    depth: number
    state: IssueState
    title: string
    body: string
    user: UserInfo
    labels: IssueLabel[]
    assignee: User
    collaborators: User[]
    repository: Repository
    milestone: null | Milestone
    created_at: string
    updated_at: string
    plan_started_at: string | null
    deadline: string | null
    finished_at: string | null
    scheduled_time: number
    comments: number
    priority: number
    issue_type: string
    program: null | Program
    security_hole: boolean
    issue_state: string
    branch: null | string
    issue_type_detail: IssueTypeDetail
    issue_state_detail: IssueStateDetail
    usefulComment?: Comment
    topicType?: string
  }

  type IssueList = IssueInfo[]

  interface IssueLabel {
    id: number
    color: string
    name: string
    repository_id: number
    url: string
    created_at: string
    updated_at: string
  }

  interface Repository {
    id: number
    full_name: string
    human_name: string
    url: string
    namespace: Namespace
    path: string
    name: string
    owner: User
    assigner: User
    description: string
    private: boolean
    public: boolean
    internal: boolean
    fork: boolean
    html_url: string
    ssh_url: string
    forks_url: string
    keys_url: string
    collaborators_url: string
    hooks_url: string
    branches_url: string
    tags_url: string
    blobs_url: string
    stargazers_url: string
    contributors_url: string
    commits_url: string
    comments_url: string
    issue_comment_url: string
    issues_url: string
    pulls_url: string
    milestones_url: string
    notifications_url: string
    labels_url: string
    releases_url: string
    recommend: boolean
    gvp: boolean
    homepage: string | null
    language: string | null
    forks_count: number
    stargazers_count: number
    watchers_count: number
    default_branch: string
    open_issues_count: number
    has_issues: boolean
    has_wiki: boolean
    issue_comment: boolean
    can_comment: boolean
    pull_requests_enabled: boolean
    has_page: boolean
    license: string | null
    outsourced: boolean
    project_creator: string
    members: string[]
    pushed_at: string
    created_at: string
    updated_at: string
    parent: null | Repository
    paas: null | string
    assignees_number: number
    testers_number: number
    assignee: User[]
    testers: User[]
    status: string
    programs: Program[]
    enterprise: string | null
    project_labels: string[]
    issue_template_source: string
  }

  interface Namespace {
    id: number
    type: string
    name: string
    path: string
    html_url: string
  }

  interface IssueTypeDetail {
    id: number
    title: string
    template: string | null
    ident: string
    color: string
    is_system: boolean
    created_at: string
    updated_at: string
  }

  interface IssueStateDetail {
    id: number
    title: string
    color: string
    icon: string
    command: string | null
    serial: number
    created_at: string
    updated_at: string
  }

  interface Issue {
    id: number
    title: string
    number: string
  }

  interface CommentTarget {
    issue: Issue
    pull_request: null | object
  }

  interface Comment {
    id: number
    in_reply_to_id?: string | number
    body: string
    body_html: string
    user: User
    source: null | object
    target: CommentTarget
    created_at: string
    updated_at: string
  }

  type IssueState = 'open' | 'closed' | 'progressing'

  type CommentList = Comment[]

  interface PaginationParams<T> {
    data: T
    total: number
    totalPage: number
  }

  type IssuesSortType = 'updated' | 'created'

  type SearchSortType = 'updated_at' | 'notes_count' | 'created_at'
}
