import type { Options, PluginSimple } from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { MarkdownEnv } from 'vitepress'

import { container } from '@mdit/plugin-container'

import { load } from 'js-yaml'
import { entries, fromPairs, isPlainObject, isString } from 'lodash-es'
import { stringifyProp } from '../utils'

export interface CardOptions {
  title: string
  desc?: string
  logo?: string
  link?: string
  color?: string
  cover?: string
  theme?: 'medium' | 'normal'
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

function checkCardProps(config: CardOptions): CardOptions | null {
  if (isPlainObject(config) && isString(config.title)) {
    return fromPairs(
      entries(config).filter(
        (item): item is [string, string] =>
          CARD_PROPS.includes(item[0]) && isString(item[1]),
      ),
    ) as unknown as CardOptions
  }

  return null
}

function cardRender(
  tokens: Token[],
  index: number,
  _options: Options,
  { relativePath }: MarkdownEnv,
): string {
  const token = tokens[index]
  const { content, info } = token

  const language = info.trim().split(':', 2)[1] || 'yml'
  let config: unknown = null

  if (language === 'yaml' || language === 'yml') {
    try {
      config = load(content)
    }
    catch (err) {
      console.error(`Parsing card YAML config failed:`, err)
    }
  }
  else if (language === 'json') {
    try {
      config = JSON.parse(content) as unknown
    }
    catch (err) {
      // do nothing
      console.error(`Parsing card JSON config failed:`, err)
    }
  }
  else {
    console.error(
      `Can not parse card config ${language}${
        relativePath ? `, found in ${relativePath}` : ''
      }.`,
    )
  }

  const cardData = checkCardProps(config as CardOptions)

  if (cardData)
    return `<Card v-bind='${stringifyProp(cardData)}' />`

  console.error(
    `Invalid card config${relativePath ? ` found in ${relativePath}` : ''}:
${content}
`,
  )

  return ''
}

const MarkdownItCard: PluginSimple = (md) => {
  // add card container
  md.use(container, {
    name: 'card',
    openRender: () =>
      `\
<div class="card-container">
`,
  })

  // Handle ```card  blocks
  const { fence } = md.renderer.rules

  md.renderer.rules.fence = (...args): string => {
    const [tokens, index, options, env] = args
    const { info } = tokens[index]
    const realInfo = info.split(':', 2)[0]?.trim() || ''

    if (realInfo === 'card')
      return cardRender(tokens, index, options, env as MarkdownEnv)

    return fence!(...args)
  }

  md.renderer.rules.card = cardRender
}

export default MarkdownItCard
