import { GITEE_API_CONFIG } from '~/services/forum/gitee/config'
import { CATEGORY_LABEL_PREFIX, isCategoryLabel } from './forumLabel'

export type ForumLabelGroup = 'type' | 'category' | 'status' | 'locale' | 'special' | 'other'

export interface ForumLabelGroupEntry {
  group: ForumLabelGroup
  labels: GITEE.IssueLabel[]
}

const GROUP_PREFIXES: ReadonlyArray<[ForumLabelGroup, string]> = [
  ['type', 'TYP-'],
  ['status', 'ST-'],
  ['category', CATEGORY_LABEL_PREFIX],
  ['locale', 'LC-'],
]

const SPECIAL_LABELS: ReadonlySet<string> = new Set(GITEE_API_CONFIG.STATE_TAGS)

const HASH_PREFIX_REGEX = /^#/
const HEX_COLOR_REGEX = /^[0-9a-f]{6}$/i

/**
 * 按命名约定归类仓库标签。`TYP-` 与特殊标签的语义被站点逻辑
 * （类型切换、置顶/关评等）硬编码依赖，归为「系统保留」；
 * `ST-` 状态与 `CATA-`/`LC-` 一样由管理页开放管理。
 */
export function classifyForumLabel(name: string): ForumLabelGroup {
  if (SPECIAL_LABELS.has(name))
    return 'special'
  for (const [group, prefix] of GROUP_PREFIXES) {
    if (name.startsWith(prefix))
      return group
  }
  return 'other'
}

/** 系统保留标签：禁止改名与删除，否则站点类型/置顶等逻辑会失联 */
export function isReservedForumLabel(name: string): boolean {
  const group = classifyForumLabel(name)
  return group === 'type' || group === 'special'
}

/** 创建新标签时是否触发了保留范围（可创建，但给出提示） */
export function usesReservedPrefix(name: string): boolean {
  return isReservedForumLabel(name)
}

/** 无 i18n 词条时的显示名兜底：反馈标签去掉 CATA- 前缀，其余原样 */
export function getFallbackLabelDisplay(label: string): string {
  return isCategoryLabel(label)
    ? label.slice(CATEGORY_LABEL_PREFIX.length)
    : label
}

const LABEL_PREFIX_REGEX = /^(?:TYP|ST|CATA|LC)-/

/** 标签名的命名前缀（TYP-/ST-/CATA-/LC-）；无前缀的杂项标签返回空串 */
export function getForumLabelPrefix(name: string): string {
  return name.match(LABEL_PREFIX_REGEX)?.[0] ?? ''
}

/** 按固定的组顺序归类一组标签，空组不返回 */
export function groupForumLabels(labels: readonly GITEE.IssueLabel[]): ForumLabelGroupEntry[] {
  const grouped = new Map<ForumLabelGroup, GITEE.IssueLabel[]>()
  for (const label of labels) {
    const group = classifyForumLabel(label.name)
    const bucket = grouped.get(group)
    if (bucket)
      bucket.push(label)
    else
      grouped.set(group, [label])
  }
  return Array.from(grouped.entries(), ([group, groupLabels]) => ({ group, labels: groupLabels.sort(byLabelName) }))
}

function byLabelName(a: GITEE.IssueLabel, b: GITEE.IssueLabel): number {
  return a.name.localeCompare(b.name)
}

/** 按背景亮度选择黑/白文字，保证色块徽章上的标签名可读 */
export function getLabelTextColor(color: string): string {
  const hex = color.replace(HASH_PREFIX_REGEX, '')
  if (!HEX_COLOR_REGEX.test(hex))
    return '#000000'
  const channels = [0, 2, 4].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const [r, g, b] = channels.map(channel =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.35 ? '#000000' : '#FFFFFF'
}

/** 标签名约束：字母、数字、连字符、下划线，与现有仓库标签约定一致 */
export const FORUM_LABEL_NAME_REGEX = /^[\w-]+$/

export function validateForumLabelName(name: string, existingNames: readonly string[]): 'required' | 'invalid' | 'taken' | null {
  const trimmed = name.trim()
  if (!trimmed)
    return 'required'
  if (trimmed.length > 48 || !FORUM_LABEL_NAME_REGEX.test(trimmed))
    return 'invalid'
  if (existingNames.some(existing => existing.toLowerCase() === trimmed.toLowerCase()))
    return 'taken'
  return null
}

export function validateForumLabelColor(color: string): boolean {
  return HEX_COLOR_REGEX.test(color.trim().replace(HASH_PREFIX_REGEX, ''))
}

export interface ForumLabelRow {
  label: GITEE.IssueLabel
  group: ForumLabelGroup
  reserved: boolean
  displayColor: string
  textColor: string
}

export function toForumLabelRow(label: GITEE.IssueLabel): ForumLabelRow {
  const displayColor = label.color.startsWith('#') ? label.color : `#${label.color}`
  return {
    label,
    group: classifyForumLabel(label.name),
    reserved: isReservedForumLabel(label.name),
    displayColor,
    textColor: getLabelTextColor(label.color),
  }
}
