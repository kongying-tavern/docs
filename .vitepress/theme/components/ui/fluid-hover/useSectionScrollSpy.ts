import type { Ref } from 'vue'
import { onBeforeUnmount, watch } from 'vue'

export interface SectionScrollSpyOptions {
  /** 滚动容器 */
  scroller: Ref<HTMLElement | undefined | null>
  /** 区段 id（文档顺序）；不在列表中的区段不参与联动 */
  sectionIds: () => string[]
  /** 滚动位置跨过区段边界时的联动回调 */
  onActiveChange: (section: string) => void
  /** 顶部判定线相对容器顶部的偏移 */
  threshold?: number
  /** 滚动到区段时预留的顶部间隙 */
  gap?: number
}

export interface SectionScrollSpy {
  scrollTo: (section: string, behavior?: ScrollBehavior) => void
}

/**
 * 区段导航滚动联动：内容滚动时按视口位置回调当前区段；
 * 程序化滚动（scrollTo）进行中自动抑制联动，停稳后恢复，
 * 避免点击目标被沿途区段覆盖（active 逐段爬行）。
 */
export function useSectionScrollSpy(options: SectionScrollSpyOptions): SectionScrollSpy {
  const { scroller, sectionIds, onActiveChange, threshold = 56, gap = 20 } = options
  let suppressed = false
  let suppressTimer: ReturnType<typeof setTimeout> | undefined
  let scrollFrame = 0

  function sectionElement(id: string): HTMLElement | null {
    return scroller.value?.querySelector<HTMLElement>(`#${id}`) ?? null
  }

  function scrollTo(section: string, behavior: ScrollBehavior = 'smooth'): void {
    const container = scroller.value
    const target = sectionElement(section)
    if (!container || !target)
      return
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    suppressed = true
    clearTimeout(suppressTimer)
    suppressTimer = setTimeout(() => suppressed = false, 160)
    container.scrollTo({
      top: container.scrollTop + targetRect.top - containerRect.top - gap,
      behavior,
    })
  }

  function syncFromScroll(): void {
    if (suppressed) {
      clearTimeout(suppressTimer)
      suppressTimer = setTimeout(() => {
        suppressed = false
      }, 160)
      return
    }
    const container = scroller.value
    if (!container)
      return
    cancelAnimationFrame(scrollFrame)
    scrollFrame = requestAnimationFrame(() => {
      const ids = sectionIds()
      if (ids.length === 0)
        return
      const containerRect = container.getBoundingClientRect()
      const edge = containerRect.top + threshold
      let current = ids[0]!
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
        current = ids.at(-1)!
      }
      else {
        for (const id of ids) {
          const element = sectionElement(id)
          if (element && element.getBoundingClientRect().top <= edge)
            current = id
        }
      }
      onActiveChange(current)
    })
  }

  watch(scroller, (element, _previous, onCleanup) => {
    if (!element)
      return
    const onScroll = () => syncFromScroll()
    element.addEventListener('scroll', onScroll, { passive: true })
    onCleanup(() => element.removeEventListener('scroll', onScroll))
  }, { flush: 'post' })

  onBeforeUnmount(() => {
    clearTimeout(suppressTimer)
    cancelAnimationFrame(scrollFrame)
  })

  return { scrollTo }
}
