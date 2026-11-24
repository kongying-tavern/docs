import { readRc } from 'zhlint'
import { normalizeConfig } from 'zhlint/lib/options.js'

export function createLintZhOptions(root = './') {
  const rc = readRc(root)
  const options = normalizeConfig(rc)
  delete options.rules.spaceOutsideHalfwidthBracket

  // VitePress 标题锚点 `{#id}` 与 zhlint 的括号配对规则冲突，作为 opaque 区域跳过。
  // “括号未匹配”是解析器错误，case-ignore 无法覆盖，必须用 hyper parser 占位。
  const HEADING_ANCHOR_REGEX = /\{#[\w-]*\}/g
  options.hyperParse.push((data) => {
    data.modifiedValue = data.modifiedValue.replace(HEADING_ANCHOR_REGEX, (originValue, index) => {
      data.ignoredByParsers.push({
        name: 'mdc-anchor',
        meta: 'mdc-anchor',
        index,
        length: originValue.length,
        originValue,
      })
      return '@'.repeat(originValue.length)
    })
    return data
  })

  // Emoji shortcodes are syntax, including image-backed site emoji paths.
  const EMOJI_SHORTCODE_REGEX = /:[\w+-]+:|:\d+\.[\u4E00-\u9FA5\w]+\/[\u4E00-\u9FA5\w-]+\.(?:png|gif|webp):/g
  options.hyperParse.unshift((data) => {
    data.modifiedValue = data.modifiedValue.replace(EMOJI_SHORTCODE_REGEX, (originValue, index) => {
      data.ignoredByParsers.push({
        name: 'emoji-shortcode',
        meta: 'emoji-shortcode',
        index,
        length: originValue.length,
        originValue,
      })
      return '@'.repeat(originValue.length)
    })
    return data
  })

  // MDC 组件的 `---` 属性块是 YAML；半角冒号是语法，不能按中文标点改写。
  const MDC_YAML_PROPS_REGEX = /(^|\n)(::[^\r\n]*\r?\n)(---\r?\n[\s\S]*?\r?\n---)(?=\r?\n)/g
  options.hyperParse.unshift((data) => {
    data.modifiedValue = data.modifiedValue.replace(
      MDC_YAML_PROPS_REGEX,
      (_originValue, leading, component, yaml, index) => {
        const yamlIndex = index + leading.length + component.length
        data.ignoredByParsers.push({
          name: 'mdc-yaml-props',
          meta: 'mdc-yaml-props',
          index: yamlIndex,
          length: yaml.length,
          originValue: yaml,
        })
        return `${leading}${component}${'@'.repeat(yaml.length)}`
      },
    )
    return data
  })

  // MDC 组件不是中文散文：`:Name[槽]{...}` 的冒号、属性名与引号都是语法，
  // 按散文规则会被要求改成全角标点。整段作为 opaque 区域跳过，槽内文字一并略过。
  const MDC_INLINE_COMPONENT_REGEX = /(^|[ \t]):[A-Z][\w-]*(?:\[[^\]]*\](?:\{[^{}]*\})?|\{[^{}]*\})/gm
  options.hyperParse.unshift((data) => {
    data.modifiedValue = data.modifiedValue.replace(
      MDC_INLINE_COMPONENT_REGEX,
      (originValue, leading, index) => {
        const value = originValue.slice(leading.length)
        data.ignoredByParsers.push({
          name: 'mdc-inline-component',
          meta: 'mdc-inline-component',
          index: index + leading.length,
          length: value.length,
          originValue: value,
        })
        return `${leading}${'@'.repeat(value.length)}`
      },
    )
    return data
  })

  // 容器写法 `:::Name{...}` 的冒号是语法，属性块里是类名与字符串。
  const MDC_BLOCK_PROPS_REGEX = /^(:{2,}[A-Z][\w-]*)\{[^{}]*\}/gm
  options.hyperParse.unshift((data) => {
    data.modifiedValue = data.modifiedValue.replace(
      MDC_BLOCK_PROPS_REGEX,
      (originValue, head, index) => {
        const props = originValue.slice(head.length)
        data.ignoredByParsers.push({
          name: 'mdc-block-props',
          meta: 'mdc-block-props',
          index: index + head.length,
          length: props.length,
          originValue: props,
        })
        return `${head}${'@'.repeat(props.length)}`
      },
    )
    return data
  })

  return options
}
