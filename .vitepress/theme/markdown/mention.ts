import type { PluginSimple } from 'markdown-it'
import type MarkdownIt from 'markdown-it'
import type ForumAPI from '~/forum/api/types'
import blogMember from '../../../src/_data/blogMemberList.json' with { type: 'json' }
import feedbackRepoMember from '../../../src/_data/feedbackMemberList.json' with { type: 'json' }
import teamMember from '../../../src/_data/teamMemberList.json' with { type: 'json' }

const WHITE_LIST: ForumAPI.User[] = [...feedbackRepoMember.data, ...teamMember.data, ...blogMember.data]

const MarkdownItMention: PluginSimple = (md: MarkdownIt) => {
  md.inline.ruler.push('mention', (state, silent) => {
    const start = state.pos
    const max = state.posMax
    const ch = state.src.charCodeAt(start)

    if (ch !== 0x40)
      return false

    let pos = start + 1
    let username = ''

    while (pos < max) {
      const ch = state.src.charCodeAt(pos)
      if (ch === 0x20 || ch === 0x09)
        break
      if (ch === 0x0A)
        break
      if (ch === 0x5B/* [ */ || ch === 0x5D/* ] */)
        break
      if (ch === 0x28/* ( */ || ch === 0x29/* ) */)
        break
      if (ch === 0x2C || ch === 0x2E)
        break
      username += state.src[pos]
      pos++
    }

    const user = WHITE_LIST.find(u => u.username === username || u.login === username)
    if (!user)
      return false

    if (silent) {
      state.pos = pos
      return true
    }

    const token = state.push('html_inline', '', 0)
    token.content = `<a class="vp-link mention" href="${user.homepage}" target="_blank" rel="noreferrer">@${username}</a>`

    state.pos = pos
    return true
  })
}

export default MarkdownItMention
