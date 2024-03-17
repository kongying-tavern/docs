import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PageInfoResponse } from '../apis/getPageInfo'

export const usePageInfoStore = defineStore('pageinfo', () => {
  // Current Pageinfo of the user.
  // @ts-ignore
  const currentPageinfo = ref<PageInfoResponse['data']>({
    good: 0,
    bad: 0,
    pageview: 0,
    lastupdate: 0,
    id: '',
    record_id: '',
  })
  // @ts-ignore
  if (import.meta.env.SSR) return currentPageinfo
  const previousPageinfos = ref<PageInfoResponse['data'][]>([])

  const usedPageinfos = computed(() => previousPageinfos.value.slice())
  const otherPageinfos = computed(() =>
    usedPageinfos.value.filter(
      (pageinfo) => pageinfo !== currentPageinfo.value,
    ),
  )

  /**
   * Changes the current Pageinfo of the user and saves the one that was used
   * before.
   *
   * @param newPageinfo - new Pageinfo to set
   */
  function setNewPageinfo(newPageinfo: PageInfoResponse['data']) {
    previousPageinfos.value.push(currentPageinfo.value)
    console.log(newPageinfo)
    currentPageinfo.value = newPageinfo
  }

  function addGood() {
    currentPageinfo.value.good++
  }

  function removeGood() {
    currentPageinfo.value.good--
  }

  return {
    setNewPageinfo,
    otherPageinfos,
    currentPageinfo,
    addGood,
    removeGood,
  }
})
