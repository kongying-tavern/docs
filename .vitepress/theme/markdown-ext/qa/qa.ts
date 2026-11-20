import type MarkdownIt from 'markdown-it'
import type { Options } from 'markdown-it'
import type { RuleBlock } from 'markdown-it/lib/parser_block.mjs'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'
import type Token from 'markdown-it/lib/token.mjs'
import type { MarkdownEnv } from 'vitepress'
import { load } from 'js-yaml'
import { entries, fromPairs, isBoolean, isPlainObject, isString } from 'lodash-es'
import { stringifyProp } from '../../utils.ts'

// Native Node cannot strip enums; plain indices keep the parser runtime-neutral.
const QA_PART = {
  CONFIG: 0,
  SUMMARY: 1,
  DETAIL: 2,
} as const

interface QAParts {
  summary?: string
  detail?: string
  config: QAOptions | null
}

export interface QAOptions {
  collapsible?: boolean
}

const SEPARATOR_TOKEN_TEST = '----'
const CONFIG_LABEL_TEST = '@config'
const OPEN_TAG_TEST = /^:{3,}\s*qa$/giu
const CLOSE_TAG_TEST = /^:{3,}$/gu
const QA_PROPS = ['collapsible']

function parseChunks(chunks: string[]): QAParts {
  const parts: QAParts = {
    config: null,
  }

  // Split lines
  let curIter: number = QA_PART.CONFIG
  let tagLevels: number[] = []
  let lines: [string[], string[], string[]] = [[], [], []]
  for (const chunk of chunks) {
    if (SEPARATOR_TOKEN_TEST === chunk.trim()) {
      if (tagLevels.length <= 0) {
        curIter++
        continue
      }
    }
    if (OPEN_TAG_TEST.test(chunk)) {
      const levelCount: number = chunk.length - chunk.replace(/^:+/g, '').length
      tagLevels.push(levelCount)
    }
    else if (CLOSE_TAG_TEST.test(chunk)) {
      const levelCount: number = chunk.length
      const lastLevelFound = tagLevels.lastIndexOf(levelCount)
      if (lastLevelFound !== -1) {
        tagLevels = tagLevels.filter((_v, i) => i < lastLevelFound)
      }
    }
    if (lines[curIter])
      lines[curIter].push(chunk)
  }

  // Re-arrange config, summary and detail
  const hasConfig: boolean
    = lines[QA_PART.CONFIG].findIndex(
      text => CONFIG_LABEL_TEST === text.trim(),
    ) !== -1
  if (hasConfig) {
    const [configLines, summaryLines, detailLines] = lines
    const cleanConfigLines = configLines.filter(
      line => CONFIG_LABEL_TEST !== line.trim(),
    )
    lines = [cleanConfigLines, summaryLines, detailLines]
  }
  else {
    const [summaryLines, detailLines] = lines
    lines = [[], summaryLines, detailLines]
  }

  // Parse config
  try {
    if (lines[QA_PART.CONFIG].length > 0) {
      const config: unknown = load(lines[QA_PART.CONFIG].join('\n').trim())
      const parsedConfig = checkQAProps(config)
      parts.config = parsedConfig
    }
  }
  catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Parsing QA config failed:`, err)
  }

  // Set summary & detail
  parts.summary = lines[QA_PART.SUMMARY].join('\n')
  parts.detail = lines[QA_PART.DETAIL].join('\n')

  return parts
}

function checkQAProps(config: unknown): QAOptions | null {
  if (!isPlainObject(config))
    return null

  return fromPairs(
    entries(config as Record<string, unknown>).filter(
      (item): item is [string, string | boolean] =>
        QA_PROPS.includes(item[0]) && (isString(item[1]) || isBoolean(item[1])),
    ),
  ) as QAOptions
}

function qaRender(tokens: Token[], index: number, _opts: Options, _env: MarkdownEnv, md?: MarkdownIt): string {
  const token = tokens[index]
  const { content } = token

  const contentChunks: string[] = content.split(/\n/g)
  const contentParts: QAParts = parseChunks(contentChunks)

  // Render title & detail
  const renderedTitle: string | undefined = md?.render(
    contentParts.summary ?? '',
  )
  const renderedDetail: string | undefined = md?.render(
    contentParts.detail ?? '',
  )

  return `\
    <QA v-bind='${stringifyProp(contentParts.config)}'>
      <template #summary>${renderedTitle}</template>
      <template #detail>${renderedDetail}</template>
    </QA>`
}

/** Match a `:::qa` block and keep its raw content, the way the built-in fence handles backticks. */
const qaFence: RuleBlock = (state: StateBlock, startLine: number, endLine: number) => {
  const marker = ':'.charCodeAt(0)
  let pos = state.bMarks[startLine] + state.tShift[startLine]
  const max = state.eMarks[startLine]

  if (state.sCount[startLine] - state.blkIndent >= 4 || pos + 3 > max)
    return false
  if (state.src.charCodeAt(pos) !== marker)
    return false

  const begin = pos
  pos = state.skipChars(pos, marker)
  const length = pos - begin
  if (length < 3)
    return false

  const markup = state.src.slice(begin, pos)
  const params = state.src.slice(pos, max)
  if (params.includes(':'))
    return false
  if (params.trim() !== 'qa')
    return false

  let nextLine = startLine
  let hasEndMarker = false
  for (;;) {
    nextLine++
    if (nextLine >= endLine)
      break

    const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
    const lineEnd = state.eMarks[nextLine]

    if (lineStart < lineEnd && state.sCount[nextLine] < state.blkIndent)
      break
    if (state.src.charCodeAt(lineStart) !== marker)
      continue
    if (state.sCount[nextLine] - state.blkIndent >= 4)
      continue

    let end = state.skipChars(lineStart, marker)
    if (end - lineStart < length)
      continue

    end = state.skipSpaces(end)
    if (end < lineEnd)
      continue

    hasEndMarker = true
    break
  }

  const indent = state.sCount[startLine]
  state.line = nextLine + (hasEndMarker ? 1 : 0)

  const token = state.push('qa', 'div', 0)
  token.info = params
  token.content = state.getLines(startLine + 1, nextLine, indent, true)
  token.markup = markup
  token.map = [startLine, state.line]
  return true
}

export function MarkdownExtQA(md: MarkdownIt, _options: unknown) {
  md.block.ruler.before('fence', 'qa', qaFence, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
  md.renderer.rules.qa = (tokens, index, options, env) =>
    qaRender(tokens, index, options, env as MarkdownEnv, md)
}
