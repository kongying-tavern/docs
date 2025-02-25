export function getTopicTypeLabelGetter() {
  const constructList: [string, string][] = [
    ['FEAT', 'TYP-FEAT'],
    ['ANN', 'TYP-ANN'],
    ['BUG', 'TYP-BUG'],
  ]

  const forwardMap = new Map(constructList)

  const reverseMap = new Map(constructList.map(([key, value]) => [value, key]))

  const getType = (label?: string | null | undefined) =>
    reverseMap.get(label ?? '')

  const getLabel = (type?: string | null | undefined) =>
    forwardMap.get(type ?? '')

  const isType = (type?: string | null | undefined) =>
    forwardMap.has(type ?? '')

  const isLabel = (label?: string | null | undefined) =>
    reverseMap.has(label ?? '')

  return {
    getType,
    getLabel,
    isType,
    isLabel,
  }
}
