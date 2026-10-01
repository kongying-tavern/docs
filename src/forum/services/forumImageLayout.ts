interface SizedImage {
  width?: number
  height?: number
}

/** A bounded justified row: preserve image proportions without letting long screenshots dominate the feed. */
export function planForumImageRow(images: readonly SizedImage[], containerWidth: number, maxHeight = 200) {
  const ratios = images.map(aspect)
  const width = Number.isFinite(containerWidth) && containerWidth > 0 ? containerWidth : 480
  const availableWidth = Math.max(1, width - Math.max(0, images.length - 1) * 8)
  const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) || 1
  // The available width takes precedence over the preferred minimum height:
  // forcing a taller row would letterbox wide images when using object-contain.
  const heightLimit = Number.isFinite(maxHeight) && maxHeight > 0 ? maxHeight : 200
  const height = Math.min(heightLimit, availableWidth / totalRatio)
  return {
    height,
    width: Math.min(width, height * totalRatio + Math.max(0, images.length - 1) * 8),
    columns: ratios.map(ratio => `${ratio}fr`).join(' '),
  }
}

export type ForumImageGridLayout = 'single' | 'two-vertical' | 'two-horizontal' | 'three-left' | 'three-top' | 'grid'

export interface ForumImageGridPlan {
  layout: ForumImageGridLayout
  order: number[]
}

function aspect(image: SizedImage): number {
  const width = Number(image.width)
  const height = Number(image.height)
  const ratio = width / height
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1
}

/** Fraction of the original image cropped by object-cover in a target cell. */
function cropLoss(image: SizedImage, targetAspect: number): number {
  const ratio = aspect(image) / targetAspect
  return 1 - Math.min(ratio, 1 / ratio)
}

export function planForumImageGrid(images: readonly SizedImage[], containerAspect = 1): ForumImageGridPlan {
  const count = Math.min(images.length, 4)
  const originalOrder = Array.from({ length: count }, (_, index) => index)
  const aspectRatio = Number.isFinite(containerAspect) && containerAspect > 0 ? containerAspect : 1

  if (count <= 1)
    return { layout: 'single', order: originalOrder }

  if (count === 2) {
    const verticalLoss = images.slice(0, 2).reduce((loss, image) => loss + cropLoss(image, aspectRatio / 2), 0)
    const horizontalLoss = images.slice(0, 2).reduce((loss, image) => loss + cropLoss(image, aspectRatio * 2), 0)
    return { layout: horizontalLoss < verticalLoss ? 'two-horizontal' : 'two-vertical', order: originalOrder }
  }

  if (count === 3) {
    let bestLayout: ForumImageGridLayout = 'three-left'
    let bestFeatured = 0
    let bestLoss = Number.POSITIVE_INFINITY

    for (const [layout, featuredAspect] of [['three-left', aspectRatio / 2], ['three-top', aspectRatio * 2]] as const) {
      for (let featured = 0; featured < count; featured++) {
        const loss = images.slice(0, count).reduce((total, image, index) =>
          total + cropLoss(image, index === featured ? featuredAspect : aspectRatio), 0)
        if (loss < bestLoss) {
          bestLoss = loss
          bestLayout = layout
          bestFeatured = featured
        }
      }
    }

    return {
      layout: bestLayout,
      order: [bestFeatured, ...originalOrder.filter(index => index !== bestFeatured)],
    }
  }

  return { layout: 'grid', order: originalOrder }
}
