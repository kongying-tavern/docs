import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({ html: true })
const DEFINITION_RE = /\{define:\s*\w+\s*\}.*?\{\/define\}/g
const MORE_RE = /<!--\s*more\s*-->/

/** Select Markdown at build time; VitePress renders it with the site's plugins. */
export function extractBlogExcerpt(source: string): string {
  const content = source.replace(/\r\n?/g, '\n')
  const lines = content.split('\n')
  const tokens = markdown.parse(content, {})
  const codeLines = new Set<number>()
  for (const token of tokens) {
    if ((token.type === 'fence' || token.type === 'code_block') && token.map) {
      for (let line = token.map[0]; line < token.map[1]; line++)
        codeLines.add(line)
    }
  }

  // Markdown handles code blocks; this stack handles same-length nested site containers.
  const containers: { start: number, end?: number, marker: number, title?: string, depth: number }[] = []
  const stack: typeof containers = []
  for (let line = 0; line < lines.length; line++) {
    if (codeLines.has(line))
      continue
    const marker = lines[line].trimEnd().match(/^ {0,3}(:{3,})(?:[ \t]+(\S.*))?$/)
    if (!marker)
      continue
    const info = marker[2]?.trim()
    if (info) {
      const container = {
        start: line,
        marker: marker[1].length,
        title: info.match(/^timeline[ \t]+(\S.*)$/)?.[1],
        depth: stack.length,
      }
      containers.push(container)
      stack.push(container)
    }
    else if (stack.length && marker[1].length >= stack.at(-1)!.marker) {
      stack.pop()!.end = line
    }
  }

  const definitions = [...lines.filter((_, line) => !codeLines.has(line)).join('\n').matchAll(DEFINITION_RE)]
    .map(match => match[0])
    .join('')
  const timeline = containers.find(container => container.title && container.depth === 0 && container.end !== undefined)
  if (timeline) {
    const body = lines.map((text, line) => {
      if (line <= timeline.start || line >= timeline.end! || codeLines.has(line))
        return ''
      if (containers.some(container => container.depth > 0 && line >= container.start && line <= (container.end ?? lines.length)))
        return ''
      return text
    }).join('\n')
    const bodyTokens = markdown.parse(body, {})
    const headings = bodyTokens.filter(token => token.type === 'heading_open' && token.level === 0 && ['h2', 'h3'].includes(token.tag))
    const start = headings[0]?.map?.[1] ?? timeline.start + 1
    const end = headings[1]?.map?.[0] ?? timeline.end!
    const items = bodyTokens.filter(token => token.type === 'list_item_open' && token.level === 1
      && token.map && token.map[0] >= start && token.map[0] < end
      && /^ {0,3}[-*+][ \t]+/.test(lines[token.map[0]]))
      .slice(0, 2)
      .map(token => lines[token.map![0]].replace(/^ {0,3}[-*+][ \t]+/, '- '))
    return `${definitions}**${timeline.title}**\n\n${items.join('\n')}`
  }

  // Only an actual HTML comment block can delimit an ordinary post's excerpt.
  const more = tokens.find(token => token.type === 'html_block' && token.level === 0 && MORE_RE.test(token.content))
  if (!more?.map)
    return ''
  const before = lines.slice(0, more.map[0]).join('\n')
  const customStart = tokens.find(token => token.type === 'hr' && token.level === 0
    && token.map && token.map[0] < more.map![0] && /^-{3,}[ \t]*$/.test(lines[token.map[0]]))
  const custom = customStart?.map ? lines.slice(customStart.map[1], more.map[0]).join('\n').trim() : ''
  const fallback = customStart?.map ? lines.slice(0, customStart.map[0]).join('\n') : before
  const excerpt = custom || fallback.trim()
  return excerpt ? `${definitions}${excerpt}` : ''
}
