import type { PluginSimple } from 'markdown-it'
import type { MarkdownEnv } from 'vitepress'

/**
 * 页面自带一级标题时，页头只保留面包屑，避免标题连正文一起出现两次。
 * 判定与 VitePress 推断页面标题的方式一致：取 token 流里第一个 h1，
 * 代码示例中的标题不会成为 token，因此不会误判。
 */
const MarkdownItDocHeaderTitle: PluginSimple = (md) => {
  const render = md.renderer.render.bind(md.renderer)
  md.renderer.render = (tokens, options, env) => {
    const { frontmatter } = env as MarkdownEnv
    if (frontmatter && frontmatter.docHeaderTitle === undefined && tokens.some(token => token.tag === 'h1'))
      frontmatter.docHeaderTitle = false
    return render(tokens, options, env)
  }
}

export default MarkdownItDocHeaderTitle
