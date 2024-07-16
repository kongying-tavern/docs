import { type MarkdownEnv } from 'vitepress'
import { load } from 'js-yaml'
import MarkdownIt from 'markdown-it'
import type { Options, PluginSimple } from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import MarkdownItFence from 'markdown-it-fence'
import {
  stringifyProp,
  entries,
  fromEntries,
  isPlainObject,
  isString,
} from '../utils.js'

export interface CardOptions {
  title: string
  desc?: string
  logo?: string
  link?: string
  color?: string
  cover?: string
  theme?: 'normal' | 'medium'
  hoverShadow?: boolean
  shadow?: boolean
}

const CARD_PROPS = [
  'title',
  'desc',
  'logo',
  'link',
  'color',
  'cover',
  'hoverShadow',
  'shadow',
  'theme',
]

const checkCardProps = (config: unknown): CardOptions | null => {
  if (isPlainObject(config) && isString(config['title']))
    return fromEntries(
      entries(config).filter(
        (item): item is [string, string] =>
          CARD_PROPS.includes(item[0]) && isString(item[1]),
      ),
    ) as unknown as CardOptions

  return null
}

const cardRender = (
  tokens: Token[],
  index: number,
  _options: Options,
  { relativePath }: MarkdownEnv,
): string => {
  const token = tokens[index]
  const { content, info } = token

  const language = info.trim().split(':', 2)[1] || 'yml'
  let config: unknown = null

  if (language === 'yaml' || language === 'yml')
    try {
      config = load(content)
    } catch (err) {
      console.error(`Parsing card YAML config failed:`, err)
    }
  else if (language === 'json')
    try {
      config = <unknown>JSON.parse(content)
    } catch (err) {
      // do nothing
      console.error(`Parsing card JSON config failed:`, err)
    }
  else
    console.error(
      `Can not parse card config ${language}${
        relativePath ? `, found in ${relativePath}` : ''
      }.`,
    )

  const cardData = checkCardProps(config)

  if (cardData) return `<Card v-bind='${stringifyProp(cardData)}' />`

  console.error(
    `Invalid card config${relativePath ? ` found in ${relativePath}` : ''}:
${content}
`,
  )

  return ''
}

export const cardPlugin: PluginSimple = (md: MarkdownIt) => {
  md.use(...createFence('card', md))
}

type FenceArgs = [
  typeof MarkdownItFence,
  string,
  {
    marker?: string
    validate?: (params: string) => boolean
    render: RenderRule
  },
]
const createFence = (klass: string, _md: MarkdownIt): FenceArgs => {
  return [
    MarkdownItFence,
    klass,
    {
      marker: '`',
      validate(params) {
        return params.split(':', 2)[0] === 'card'
      },
      render(
        tokens: Token[],
        idx: number,
        options: MarkdownIt.Options,
        env: any,
      ) {
        return cardRender(tokens, idx, options, <MarkdownEnv>env)
      },
    },
  ]
}
