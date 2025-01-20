import { uniq } from 'lodash-es'

export const composeTopicBody = (
  body: string,
  labels: (string | null | undefined)[],
): string => {
  const meta = {
    labels: uniq(labels.filter((v) => v)),
  }
  const content = `<!-- ${JSON.stringify(meta)} -->${body}`
  return content
}
