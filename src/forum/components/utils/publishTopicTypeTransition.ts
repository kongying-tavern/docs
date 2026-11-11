/** Move the selected row to the mounted type trigger, keeping it visible for the whole motion. */
export function preparePublishTypeMotion(source: HTMLElement, shell: HTMLElement) {
  const rect = source.getBoundingClientRect()
  const shellRect = shell.getBoundingClientRect()
  const previousShellStyle = { height: shell.style.height, flex: shell.style.flex, overflow: shell.style.overflow }
  Object.assign(shell.style, { height: `${shellRect.height}px`, flex: 'none', overflow: 'clip' })
  function snapshot(element: HTMLElement, zIndex: number) {
    const bounds = element.getBoundingClientRect()
    const copy = element.cloneNode(true) as HTMLElement
    const originals = [element, ...element.querySelectorAll<HTMLElement>('*')]
    const copies = [copy, ...copy.querySelectorAll<HTMLElement>('*')]
    originals.forEach((original, index) => {
      const style = getComputedStyle(original)
      for (const property of style)
        copies[index].style.setProperty(property, style.getPropertyValue(property))
      copies[index].style.setProperty('view-transition-name', 'none')
      copies[index].removeAttribute('id')
    })
    copy.setAttribute('aria-hidden', 'true')
    copy.inert = true
    Object.assign(copy.style, {
      position: 'fixed',
      margin: '0',
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      minWidth: '0',
      minHeight: '0',
      maxWidth: 'none',
      maxHeight: 'none',
      zIndex: String(zIndex),
      pointerEvents: 'none',
      transition: 'none',
      animation: 'none',
      transform: 'none',
      boxSizing: 'border-box',
    })
    return copy
  }
  const ghost = snapshot(source, 2147483647)
  ghost.setAttribute('data-publish-type-ghost', '')
  const chooser = source.closest<HTMLElement>('[data-publish-type-chooser]')
  const chooserGhost = chooser ? snapshot(chooser, 2147483646) : undefined
  const animations: Animation[] = []
  let target: HTMLElement | null = null
  let previousOpacity = ''
  let cancelled = false
  const cancel = () => {
    if (cancelled)
      return
    cancelled = true
    animations.forEach(animation => animation.cancel())
    Object.assign(shell.style, previousShellStyle)
    ghost.remove()
    chooserGhost?.remove()
    if (target)
      target.style.opacity = previousOpacity
    target = null
  }
  const play = async () => {
    if (cancelled)
      return
    try {
      if (chooserGhost) {
        source.ownerDocument.body.append(chooserGhost)
        animations.push(chooserGhost.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 100,
          easing: 'cubic-bezier(0.22, 0.8, 0.25, 1)',
          fill: 'forwards',
        }))
      }
      source.ownerDocument.body.append(ghost)
      // The desktop trigger mounts with the form; a missing target must not
      // keep the editor hidden if its structure changes or it is removed.
      const mountedTarget = shell.querySelector<HTMLElement>('[data-publish-type-target]')
      if (!mountedTarget?.isConnected)
        return
      target = mountedTarget
      previousOpacity = target.style.opacity
      // Measure the mounted form at its natural height, then grow the current
      // shell from the chooser's height without painting an intermediate jump.
      Object.assign(shell.style, { height: previousShellStyle.height, flex: previousShellStyle.flex })
      const formHeight = shell.getBoundingClientRect().height
      const endpoint = target.getBoundingClientRect()
      Object.assign(shell.style, { height: `${shellRect.height}px`, flex: 'none' })
      if (!endpoint.width || !endpoint.height)
        return
      const style = getComputedStyle(target)
      // A pill's declared 9999px radius must interpolate to its used radius.
      const radius = Math.min(Number.parseFloat(style.borderTopLeftRadius || style.borderRadius) || 0, endpoint.width / 2, endpoint.height / 2)
      target.style.opacity = '0'
      const timing = { duration: 280, easing: 'cubic-bezier(0.22, 0.8, 0.25, 1)', fill: 'forwards' } satisfies KeyframeAnimationOptions
      animations.push(ghost.animate([
        { transform: 'translate(0px, 0px)', width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: ghost.style.borderRadius, padding: ghost.style.padding },
        { transform: `translate(${endpoint.left - rect.left}px, ${endpoint.top - rect.top}px)`, width: `${endpoint.width}px`, height: `${endpoint.height}px`, borderRadius: `${radius}px`, padding: style.padding, backgroundColor: style.backgroundColor, cornerShape: style.getPropertyValue('corner-shape') },
      ], timing))
      // Hand the last frames to the real trigger so its text/icon never snap.
      const handoffDuration = 60
      const handoffTiming = { duration: handoffDuration, delay: timing.duration - handoffDuration, easing: timing.easing, fill: 'forwards' } satisfies KeyframeAnimationOptions
      animations.push(
        ghost.animate([{ opacity: 1 }, { opacity: 0 }], handoffTiming),
        target.animate([{ opacity: 0 }, { opacity: 1 }], handoffTiming),
      )
      if (formHeight !== shellRect.height) {
        animations.push(shell.animate([
          { height: `${shellRect.height}px` },
          { height: `${formHeight}px` },
        ], timing))
      }
      const form = shell.querySelector<HTMLElement>('[data-publish-type-form]')
      if (form) {
        animations.push(form.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          delay: 60,
          easing: timing.easing,
          fill: 'both',
        }))
      }
      const arrow = ghost.lastElementChild
      const targetArrow = target.lastElementChild
      if (arrow && targetArrow) {
        const arrowStyle = getComputedStyle(targetArrow)
        animations.push(arrow.animate([
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(90deg)', width: arrowStyle.width, height: arrowStyle.height },
        ], timing))
      }
      await Promise.all(animations.map(animation => animation.finished))
    }
    catch {
      // Closing the dialog or changing the viewport can cancel the animation.
    }
    finally {
      cancel()
    }
  }
  return { play, cancel }
}
