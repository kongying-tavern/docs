import type ForumAPI from '@/apis/forum/api'
import type { PluginSimple } from 'markdown-it'
import type MarkdownIt from 'markdown-it'
import blogMember from '../../../src/_data/blogMemberList.json'
import feedbackRepoMember from '../../../src/_data/feedbackMemberList.json'
import teamMember from '../../../src/_data/teamMemberList.json'

const WHITE_LIST: ForumAPI.User[] = [...feedbackRepoMember, ...teamMember, ...blogMember]

const MarkdownItMention: PluginSimple = (md: MarkdownIt) => {
  md.inline.ruler.push('mention', (state, silent) => {
    const start = state.pos
    const max = state.posMax
    const ch = state.src.charCodeAt(start)

    // 检查是否以 @ 开头
    if (ch !== 0x40/* @ */)
      return false

    let pos = start + 1
    let username = ''

    // 收集用户名
    while (pos < max) {
      const ch = state.src.charCodeAt(pos)
      if (ch === 0x20/* space */ || ch === 0x09/* \t */)
        break
      if (ch === 0x0A/* \n */)
        break
      if (ch === 0x5B/* [ */ || ch === 0x5D/* ] */)
        break
      if (ch === 0x28/* ( */ || ch === 0x29/* ) */)
        break
      if (ch === 0x2C/* , */ || ch === 0x2E/* . */)
        break
      username += state.src[pos]
      pos++
    }

    // 检查用户名是否在白名单中（同时检查 username 和 login）
    const user = WHITE_LIST.find(u => u.username === username || u.login === username)
    if (!user)
      return false

    if (silent)
      return true

    const token = state.push('html_inline', '', 0)
    token.content = `<a class="vp-link mention" href="${user.homepage}" target="_blank" rel="noreferrer">@${username}</a>`

    state.pos = pos
    return true
  })
}

export default MarkdownItMention
