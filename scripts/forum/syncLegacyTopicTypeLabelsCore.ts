export type TopicType = 'BUG' | 'FEAT' | 'ANN'

export interface LegacyTopicIssue {
  number: string
  title: string
  body: string | null
  labels: { name: string }[]
}

export interface PlannedTopicLabels {
  type: TopicType
  labels: string[]
  otherLabels: string[]
}

const TYPE_PREFIX = /^(BUG|FEAT|ANN):/i
const TYPE_LABEL = /^TYP-(?:BUG|FEAT|ANN)$/

export function getIssueLabelNames(issue: LegacyTopicIssue): string[] {
  if (!Array.isArray(issue.labels))
    throw new Error(`Issue ${issue.number} has no label list; refusing to update it.`)
  return issue.labels.map(label => label.name).filter(Boolean)
}

export function planTopicTypeLabels(issue: LegacyTopicIssue): PlannedTopicLabels | undefined {
  const type = TYPE_PREFIX.exec(issue.title)?.[1]?.toUpperCase() as TopicType | undefined
  if (!type)
    return undefined

  const currentLabels = getIssueLabelNames(issue)
  const currentTypes = currentLabels.filter(label => TYPE_LABEL.test(label))
  const wanted = `TYP-${type}`
  if (currentTypes.length === 1 && currentTypes[0] === wanted)
    return undefined

  const otherLabels = currentLabels.filter(label => !TYPE_LABEL.test(label))
  return { type, labels: [...otherLabels, wanted], otherLabels }
}

export function verifiesTopicTypeLabels(
  before: LegacyTopicIssue,
  after: LegacyTopicIssue,
  planned: PlannedTopicLabels,
): boolean {
  const actual = getIssueLabelNames(after)
  const types = actual.filter(label => TYPE_LABEL.test(label))
  const others = actual.filter(label => !TYPE_LABEL.test(label))
  return types.length === 1
    && types[0] === `TYP-${planned.type}`
    && planned.otherLabels.every(label => others.includes(label))
    && after.body === before.body
}
