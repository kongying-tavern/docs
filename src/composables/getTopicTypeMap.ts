import { useData } from 'vitepress'

export const getTopicTypeMap = () => {
  const { theme } = useData()

  return new Map([
    ['FEAT', theme.value.forum.topic.type.feat],
    ['ANN', theme.value.forum.topic.type.ann],
    ['BUG', theme.value.forum.topic.type.bug],
    ['SUG', theme.value.forum.topic.type.sug],
  ])
}
