import { useLocalized } from '@/hooks/useLocalized'

export const getTopicTypeMap = () => {
  const { message } = useLocalized()

  return new Map([
    ['FEAT', message.value.forum.topic.type.feat],
    ['ANN', message.value.forum.topic.type.ann],
    ['BUG', message.value.forum.topic.type.bug],
    ['SUG', message.value.forum.topic.type.sug],
  ])
}
