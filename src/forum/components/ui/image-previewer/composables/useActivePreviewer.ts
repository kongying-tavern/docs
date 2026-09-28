/**
 * 预览器控制器（模块级单例）。
 * 侧边面板内容复用的嵌套实例点击缩略图时，委托给当前活跃的预览器：
 * 图片能在活跃列表中找到则直接切换；找不到（如点击的是评论图片）
 * 则替换活跃预览器的图片列表，避免再开一层全屏预览或重复播放面板动画。
 */
interface PreviewerImageRef {
  src: string
  alt?: string
}

interface ActivePreviewer {
  getImages: () => PreviewerImageRef[]
  goTo: (index: number) => void
  setImages: (images: PreviewerImageRef[], index: number) => void
  isOpen: () => boolean
}

let activePreviewer: ActivePreviewer | null = null

export function useActivePreviewer() {
  function tryDelegate(index: number, images: PreviewerImageRef[]): boolean {
    if (!activePreviewer?.isOpen())
      return false
    const img = images[index]
    if (!img)
      return false
    const outerIndex = activePreviewer.getImages().findIndex(i => i.src === img.src)
    if (outerIndex < 0) {
      activePreviewer.setImages(images, index)
      return true
    }
    activePreviewer.goTo(outerIndex)
    return true
  }

  function register(controller: ActivePreviewer): void {
    activePreviewer = controller
  }

  function unregister(controller: ActivePreviewer): void {
    if (activePreviewer === controller)
      activePreviewer = null
  }

  return { tryDelegate, register, unregister }
}
