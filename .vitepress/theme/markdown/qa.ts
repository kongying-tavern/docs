import type { MarkdownEnv } from 'vitepress'
import { load } from 'js-yaml'
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import MarkdownItFence from 'markdown-it-fence'
import {
  isPlainObject,
  isString,
  isBoolean,
  fromEntries,
  entries,
  stringifyProp,
} from '../utils'

enum QAPartEnum {
  CONFIG,
  SUMMARY,
  DETAIL,
}

interface QAParts {
  summary?: string
  detail?: string
  config: QAOptions | null
}

export interface QAOptions {
  collapsible?: boolean
}

const SEPARATOR_TOKEN_TEST = /----/giu
const CONFIG_LABEL_TEST = /@config/giu
const OPEN_TAG_TEST = /^:{3,}\s*qa$/giu
const CLOSE_TAG_TEST = /^:{3,}$/giu
const QA_PROPS = ['collapsible']

const parseChunks = (chunks: string[]): QAParts => {
  const parts: QAParts = {
    config: null,
  }

  // Split lines
  let curIter: number = QAPartEnum.CONFIG
  let tagLevels: number[] = []
  let lines: [string[], string[], string[]] = [[], [], []]
  for (let chunk of chunks) {
    if (SEPARATOR_TOKEN_TEST.test(chunk)) {
      if (tagLevels.length <= 0) {
        curIter++
        continue
      }
    }
    if (OPEN_TAG_TEST.test(chunk)) {
      const levelCount: number = chunk.length - chunk.replace(/^:+/g, '').length
      tagLevels.push(levelCount)
    } else if (CLOSE_TAG_TEST.test(chunk)) {
      const levelCount: number = chunk.length
      const lastLevelFound = tagLevels.lastIndexOf(levelCount)
      if (lastLevelFound !== -1) {
        tagLevels = tagLevels.filter((_v, i) => i < lastLevelFound)
      }
    }
    if (lines[curIter]) lines[curIter].push(chunk)
  }

  // Re-arrange config, summary and detail
  const hasConfig: boolean =
    lines[QAPartEnum.CONFIG].findIndex((text) =>
      CONFIG_LABEL_TEST.test(text),
    ) !== -1
  if (hasConfig) {
    const [configLines, summaryLines, detailLines] = lines
    const cleanConfigLines = configLines.filter(
      (line) => !CONFIG_LABEL_TEST.test(line),
    )
    lines = [cleanConfigLines, summaryLines, detailLines]
  } else {
    const [summaryLines, detailLines] = lines
    lines = [[], summaryLines, detailLines]
  }

  // Parse config
  try {
    if (lines[QAPartEnum.CONFIG].length > 0) {
      const config: unknown = load(lines[QAPartEnum.CONFIG].join('\n').trim())
      const parsedConfig = checkQAProps(config)
      parts.config = parsedConfig
    }
  } catch (err) {
    console.error(`Parsing QA config failed:`, err)
  }

  // Set summary & detail
  parts.summary = lines[QAPartEnum.SUMMARY].join('\n')
  parts.detail = lines[QAPartEnum.DETAIL].join('\n')

  return parts
}

const checkQAProps = (config: unknown): QAOptions | null => {
  if (!isPlainObject(config)) return null

  return fromEntries(
    entries(config).filter(
      (item): item is [string, string | boolean] =>
        QA_PROPS.includes(item[0]) && (isString(item[1]) || isBoolean(item[1])),
    ),
  ) as QAOptions
}

const qaRender = (
  tokens: Token[],
  index: number,
  _opts: MarkdownIt.Options,
  _env: MarkdownEnv,
  md?: MarkdownIt,
): string => {
  const token = tokens[index]
  const { content } = token

  const contentChunks: string[] = content.split(/\n/g)
  const contentParts: QAParts = parseChunks(contentChunks)

  // Render title & detail
  const renderedTitle: string | undefined = md?.render(contentParts.summary!)
  const renderedDetail: string | undefined = md?.render(contentParts.detail!)

  return `\
    <QA v-bind='${stringifyProp(contentParts.config)}'>
      <template #summary>${renderedTitle}</template>
      <template #detail>${renderedDetail}</template>
    </QA>`
}

export const qa = (md: MarkdownIt, options: any) => {
  md.use(...createFence('qa', md))
}

type FenceArgs = [
  typeof MarkdownItFence,
  string,
  { marker?: string; render: RenderRule },
]
const createFence = (klass: string, md: MarkdownIt): FenceArgs => {
  return [
    MarkdownItFence,
    klass,
    {
      marker: ':',
      render(
        tokens: Token[],
        idx: number,
        options: MarkdownIt.Options,
        env: any,
      ) {
        return qaRender(tokens, idx, options, <MarkdownEnv>env, md)
      },
    },
  ]
}
