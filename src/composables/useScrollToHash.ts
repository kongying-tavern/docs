import { onMounted, onUnmounted } from 'vue'

interface ScrollToHashOptions {
  offset?: number
  smooth?: boolean
  overrideBrowserBehavior?: boolean // 是否覆盖浏览器默认行为
}

export const useScrollToHash = (
  options: ScrollToHashOptions = {
    offset: 0,
    smooth: true,
    overrideBrowserBehavior: false,
  },
) => {
  if (import.meta.env.SSR) return
  const scrollToElement = (hash: string) => {
    const targetId = hash.replace('#', '')
    const targetElement = document.getElementById(targetId)

    if (targetElement) {
      if (options.overrideBrowserBehavior) {
        const top =
          targetElement.getBoundingClientRect().top +
          window.scrollY -
          (options.offset || 0)
        window.scrollTo({
          top,
          behavior: options.smooth ? 'smooth' : 'auto',
        })
      }
      return
    }

    const observer = new MutationObserver(() => {
      const element = document.getElementById(targetId)
      if (element) {
        const top =
          element.getBoundingClientRect().top +
          window.scrollY -
          (options.offset || 0)
        window.scrollTo({
          top,
          behavior: options.smooth ? 'smooth' : 'auto',
        })
        observer.disconnect()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  const handleHashChange = () => {
    const hash = window.location.hash
    if (hash) {
      scrollToElement(hash)
    }
  }

  onMounted(() => {
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange, { once: true })
  })

  onUnmounted(() => {
    window.removeEventListener('hashchange', handleHashChange)
  })
}
