import type { CustomAtRules, DimensionPercentageFor_LengthValue, Selector, Visitor } from 'lightningcss'
import type { Plugin } from 'vite'
import { Buffer } from 'node:buffer'
import { transform } from 'lightningcss'

function isUiSource(source: string): boolean {
  return /\/(?:src\/(?:forum\/components|components)|\.vitepress\/theme\/components\/ui)\//.test(source.replaceAll('\\', '/'))
}

export function scaleUiCss(source: string, id: string) {
  if (!isUiSource(id) || !(id.includes('type=style') || /\.css(?:\?|$)/.test(id)))
    return
  const result = transform({ filename: id, code: Buffer.from(source), sourceMap: true, visitor: createUiScaleVisitor() })
  return { code: result.code.toString(), map: result.map?.toString() }
}

export function uiScalePlugin(): Plugin {
  return {
    name: 'theme:ui-scale',
    configResolved(config) {
      // VitePress appends Vue after root-config plugins; adapt the expanded CSS before vite:css-post.
      const plugins = config.plugins as Plugin[]
      const ownIndex = plugins.findIndex(plugin => plugin.name === 'theme:ui-scale')
      const vueIndex = plugins.findIndex(plugin => plugin.name === 'vite:vue')
      if (ownIndex >= 0 && ownIndex < vueIndex) {
        const [plugin] = plugins.splice(ownIndex, 1)
        plugins.splice(vueIndex, 0, plugin)
      }
    },
    transform: scaleUiCss,
  }
}

function pixels(value: DimensionPercentageFor_LengthValue): number | undefined {
  return value.type === 'dimension' && value.value.unit === 'px' ? value.value.value : undefined
}

function target(selector: Selector): Selector {
  const last = selector.findLastIndex(part => part.type === 'combinator')
  return selector.slice(last + 1)
}

function isInput(selector: Selector): boolean {
  return target(selector).some(part => (part.type === 'type' && ['input', 'textarea'].includes(part.name))
    || (part.type === 'class' && part.name.endsWith('-input'))
    || (part.type === 'attribute' && part.name === 'data-slot' && part.operation?.operator === 'equal'
      && part.operation.value.endsWith('-input')))
}

/** Adapt legacy source CSS at the theme boundary; layout, media, and measured coordinates stay absolute. */
export function createUiScaleVisitor(): Visitor<CustomAtRules> {
  let sources: string[] = []
  const stack: { ui: boolean, glyph: boolean, control: boolean, input: boolean }[] = []
  const scaled = (size: number) => `calc(${size}px * var(--site-ui-scale))`

  return {
    StyleSheet(sheet) {
      sources = sheet.sources
    },
    Rule: {
      style({ value: rule }) {
        const ui = isUiSource(sources[rule.loc.source_index] ?? '')
        const selectors = rule.selectors.map(target)
        const declarations = [...rule.declarations.declarations, ...rule.declarations.importantDeclarations]
        const height = declarations.find(declaration => declaration.property === 'height')
        const minimum = declarations.find(declaration => declaration.property === 'min-height')
        const fixedControl = height?.property === 'height' && minimum?.property === 'min-height'
          && height.value.type === 'length-percentage' && minimum.value.type === 'length-percentage'
          && pixels(height.value.value) !== undefined && pixels(height.value.value) === pixels(minimum.value.value)
        stack.push({
          ui,
          input: rule.selectors.some(isInput),
          glyph: selectors.some(selector => selector.some(part => (part.type === 'type' && part.name === 'svg')
            || (part.type === 'class' && (part.name === 'icon-btn' || part.name.endsWith('-icon') || part.name.startsWith('i-'))))),
          control: !!fixedControl || selectors.every(selector => selector.some(part => (part.type === 'type' && ['button', 'input', 'textarea', 'select'].includes(part.name))
            || (part.type === 'class' && /-(?:button|trigger|control|input)$/.test(part.name))
            || (part.type === 'attribute' && part.name === 'data-slot' && part.operation?.operator === 'equal'
              && /(?:button|trigger|input)$/.test(part.operation.value)))),
        })
      },
    },
    RuleExit: {
      style() {
        stack.pop()
      },
    },
    Declaration(declaration) {
      const context = stack.at(-1)
      if (!context?.ui)
        return

      if ((declaration.property === 'font-size' || declaration.property === 'line-height') && declaration.value.type === 'length') {
        const size = pixels(declaration.value.value)
        if (size !== undefined && size > 0) {
          // Keep an existing input font floor while allowing the large UI preference.
          const floor = context.input && declaration.property === 'font-size'
          return { property: declaration.property, raw: floor ? `max(${size}px, ${scaled(size)})` : scaled(size) }
        }
      }

      if ((declaration.property === 'width' || declaration.property === 'height' || declaration.property === 'min-width' || declaration.property === 'min-height')
        && declaration.value.type === 'length-percentage') {
        const size = pixels(declaration.value.value)
        if (size !== undefined && size > 0 && (context.glyph || context.control)) {
          return {
            property: declaration.property,
            raw: context.control ? `max(${size}px, ${scaled(size)})` : scaled(size),
          }
        }
      }

      if (declaration.property === 'custom' && declaration.value.name.startsWith('--') && declaration.value.name.endsWith('-icon-size')
        && declaration.value.value.length === 1 && declaration.value.value[0].type === 'length') {
        const size = declaration.value.value[0].value
        if (size.unit === 'px' && size.value > 0)
          return { property: `--${declaration.value.name.slice(2)}` as const, raw: scaled(size.value) }
      }
    },
  }
}
