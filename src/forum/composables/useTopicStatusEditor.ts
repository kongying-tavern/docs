import type ForumAPI from '~/forum/api/forum'
import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

/**
 * 归档确认弹窗的全局开关。设置状态已改为话题菜单里的二级菜单直接选择，
 * 这里只剩「归档时挑一个结论状态」这一条路径 —— 归档会改变话题的可见性，
 * 仍是需要确认的一步。
 */
export const useTopicStatusEditor = createGlobalState(() => {
  const open = ref(false)
  const topic = ref<ForumAPI.Topic | null>(null)

  function openCloseTopicDialog(newTopic: ForumAPI.Topic) {
    topic.value = newTopic
    open.value = true
  }

  return {
    open,
    topic,
    openCloseTopicDialog,
  }
})
