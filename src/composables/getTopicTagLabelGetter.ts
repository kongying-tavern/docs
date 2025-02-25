export function getTopicTagLabelGetter() {
  const constructList: [string, string][] = [
    ['DOCS-ISSUE', 'CATA-DOCS'],
    ['TYPOS-ISSUE', 'CATA-TYPOS'],
    ['DISPLAY-ISSUE', 'CATA-DISPLAY'],
    ['LOGIN-ISSUE', 'CATA-LOGIN'],
    ['PERFORMANCE-ISSUE', 'CATA-PERFORMANCE'],
    ['TRANSLATION-ISSUE', 'CATA-TRANSLATION'],
    ['OTHER-ISSUE', 'CATA-OTHER'],
    ['PIN-ISSUE', 'CATA-PIN'],
    ['ALL-PLATFORM', 'CATA-ALL-PLATFORM'],
    ['WEB-PLATFORM', 'CATA-WEB-PLATFORM'],
    ['CLIENT-PLATFORM', 'CATA-CLIENT-PLATFORM'],
  ]

  const forwardMap = new Map(constructList)

  const reverseMap = new Map(constructList.map(([key, value]) => [value, key]))

  const getTag = (label?: string | null | undefined) =>
    reverseMap.get(label ?? '')

  const getLabel = (tag?: string | null | undefined) =>
    forwardMap.get(tag ?? '')

  const isTag = (tag?: string | null | undefined) => forwardMap.has(tag ?? '')

  const isLabel = (label?: string | null | undefined) =>
    reverseMap.has(label ?? '')

  const toTags = (labels?: string[] | null | undefined) =>
    labels ? labels.map(label => getTag(label)) : []

  const toLabels = (tags?: string[] | null | undefined) =>
    tags ? tags.map(tag => getLabel(tag)) : []

  return {
    getTag,
    getLabel,
    isTag,
    isLabel,
    toTags,
    toLabels,
  }
}
