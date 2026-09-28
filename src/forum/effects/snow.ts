import type {
  ForumFestivalEffectController,
  ForumFestivalEffectOptions,
  ForumFestivalEffectStopOptions,
} from './types'
import './snow.css'

interface Snowflake {
  active: boolean
  opacity: number
  size: number
  speed: number
  step: number
  stepSize: number
  velX: number
  velY: number
  windSpeed: number
  x: number
  y: number
}

interface ClickSnowflake {
  bornAt: number
  color: string
  lifetimeMs: number
  rotation: number
  rotationVelocity: number
  size: number
  velX: number
  velY: number
  x: number
  y: number
}

const FLAKE_COUNT = 400
const POINTER_INFLUENCE_RADIUS = 150
const FRAME_DURATION = 1000 / 60
const SETTLE_DURATION_MS = 6_000
const MAX_NATURAL_TAIL_MS = 5_000
const MAX_CLICK_SNOWFLAKES = 160
const CURSOR_FOLLOW_RETAINED_DISTANCE = 0.82
const CURSOR_TRAIL_DELAY_MIN_MS = 170
const CURSOR_TRAIL_DELAY_VARIANCE_MS = 130
const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  'summary',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
  '[data-fluid-hover-item]',
  '[draggable="true"]',
].join(',')
const CLICK_SNOWFLAKE_COLORS = ['#ffffff', '#dbeafe', '#bae6fd', '#7dd3fc']
const SNOWFLAKE_CURSOR_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <defs>
      <linearGradient id="cursorSnowGradient" x1="6" y1="5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#e0f2fe"/>
        <stop offset=".3" stop-color="#7dd3fc"/>
        <stop offset=".68" stop-color="#38bdf8"/>
        <stop offset="1" stop-color="#6366f1"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 3v26M4.7 9.5l22.6 13M4.7 22.5l22.6-13M12 6.5l4 3.5 4-3.5M12 25.5l4-3.5 4 3.5M6.8 13.7l5.1-.8.9-5M25.2 18.3l-5.1.8-.9 5M6.8 18.3l5.1.8.9 5M25.2 13.7l-5.1-.8-.9-5" stroke="#dbeafe" stroke-width="3.4" opacity=".65"/>
      <path d="M16 3v26M4.7 9.5l22.6 13M4.7 22.5l22.6-13M12 6.5l4 3.5 4-3.5M12 25.5l4-3.5 4 3.5M6.8 13.7l5.1-.8.9-5M25.2 18.3l-5.1.8-.9 5M6.8 18.3l5.1.8.9 5M25.2 13.7l-5.1-.8-.9-5" stroke="url(#cursorSnowGradient)" stroke-width="2.1"/>
    </g>
  </svg>
`
const SNOWFLAKE_CURSOR_SRC = `data:image/svg+xml,${encodeURIComponent(SNOWFLAKE_CURSOR_SVG)}`

export function startFestivalEffect(
  options: ForumFestivalEffectOptions,
): ForumFestivalEffectController {
  if (
    typeof document === 'undefined'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return { finished: Promise.resolve(), stop: () => {} }
  }

  const canvas = document.createElement('canvas')
  canvas.dataset.forumFestivalEffect = 'true'
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100dvh',
    pointerEvents: 'none',
    zIndex: '79',
  })
  document.body.append(canvas)

  const canvasContext = canvas.getContext('2d')
  if (!canvasContext) {
    canvas.remove()
    return { finished: Promise.resolve(), stop: () => {} }
  }
  const context = canvasContext
  const supportsSnowCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const cursorElement = supportsSnowCursor ? document.createElement('div') : null
  const cursorFeedbackElement = supportsSnowCursor ? document.createElement('div') : null
  if (cursorElement && cursorFeedbackElement) {
    const cursorImage = document.createElement('img')
    cursorElement.className = 'forum-festival-snow-cursor-visual'
    cursorElement.setAttribute('aria-hidden', 'true')
    cursorFeedbackElement.className = 'forum-festival-snow-cursor-feedback'
    cursorImage.className = 'forum-festival-snow-cursor-image'
    cursorImage.src = SNOWFLAKE_CURSOR_SRC
    cursorImage.alt = ''
    cursorImage.draggable = false
    cursorFeedbackElement.addEventListener('animationend', () => {
      cursorFeedbackElement.classList.remove('is-bursting')
    })
    cursorFeedbackElement.append(cursorImage)
    cursorElement.append(cursorFeedbackElement)
    document.body.append(cursorElement)
    document.documentElement.classList.add('forum-festival-snow-cursor')
  }

  const flakes: Snowflake[] = []
  const clickSnowflakes: ClickSnowflake[] = []
  const startedAt = performance.now()
  let viewportWidth = 0
  let viewportHeight = 0
  let pointerX = -1000
  let pointerY = -1000
  let cursorTargetX = 0
  let cursorTargetY = 0
  let cursorX = 0
  let cursorY = 0
  let cursorPositionInitialized = false
  let animationFrame = 0
  let fadeOutTimer = 0
  let hardStopTimer = 0
  let fadingOut = false
  let stopped = false
  let previousFrameAt = startedAt
  let nextCursorTrailAt = startedAt
  let resolveFinished = () => {}
  const finished = new Promise<void>((resolve) => {
    resolveFinished = resolve
  })

  function resetFlake(flake: Snowflake, initial = false): void {
    flake.active = true
    flake.size = Math.random() * 3 + 2
    flake.x = Math.random() * viewportWidth
    flake.y = initial ? -Math.random() * viewportHeight * 0.45 : -flake.size
    const traversalSeconds = 7 + Math.random() * 3
    flake.speed = viewportHeight / (60 * traversalSeconds)
    flake.velY = flake.speed
    flake.windSpeed = 0.18 + Math.random() * 0.2
    flake.velX = flake.windSpeed
    flake.opacity = Math.random() * 0.5 + 0.3
    flake.stepSize = Math.random() / 30
    flake.step = Math.random() * Math.PI * 2
  }

  function resizeCanvas(): void {
    const previousWidth = viewportWidth
    const previousHeight = viewportHeight
    viewportWidth = window.innerWidth
    viewportHeight = window.innerHeight
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(viewportWidth * pixelRatio)
    canvas.height = Math.round(viewportHeight * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    if (previousWidth > 0 && previousHeight > 0) {
      const scaleX = viewportWidth / previousWidth
      const scaleY = viewportHeight / previousHeight
      for (const flake of flakes) {
        flake.x *= scaleX
        flake.y *= scaleY
      }
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    pointerX = event.clientX
    pointerY = event.clientY
    if (cursorElement && event.pointerType !== 'touch' && !fadingOut) {
      cursorTargetX = event.clientX
      cursorTargetY = event.clientY
      if (!cursorPositionInitialized) {
        cursorX = cursorTargetX
        cursorY = cursorTargetY
        cursorPositionInitialized = true
      }
      cursorElement.style.opacity = '1'
    }
  }

  function handlePointerLeave(): void {
    pointerX = -1000
    pointerY = -1000
    cursorPositionInitialized = false
    if (cursorElement)
      cursorElement.style.opacity = '0'
  }

  function isInteractiveClick(event: MouseEvent): boolean {
    if (event.defaultPrevented || event.button !== 0)
      return true

    for (const eventTarget of event.composedPath()) {
      if (!(eventTarget instanceof Element))
        continue
      if (eventTarget.matches(INTERACTIVE_SELECTOR))
        return true
      if (getComputedStyle(eventTarget).cursor === 'pointer')
        return true
      if (eventTarget === document.body)
        break
    }
    return false
  }

  function handlePageClick(event: MouseEvent): void {
    if (fadingOut || isInteractiveClick(event))
      return

    const particleCount = 8 + Math.floor(Math.random() * 6)
    const bornAt = performance.now()
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2
      const velocity = 0.75 + Math.random() * 1.6
      clickSnowflakes.push({
        bornAt,
        color: CLICK_SNOWFLAKE_COLORS[Math.floor(Math.random() * CLICK_SNOWFLAKE_COLORS.length)]!,
        lifetimeMs: 650 + Math.random() * 450,
        rotation: Math.random() * Math.PI,
        rotationVelocity: (Math.random() - 0.5) * 0.09,
        size: 4 + Math.random() * 3.5,
        velX: Math.cos(angle) * velocity + 0.2,
        velY: Math.sin(angle) * velocity - 0.25,
        x: event.clientX,
        y: event.clientY,
      })
    }
    if (clickSnowflakes.length > MAX_CLICK_SNOWFLAKES)
      clickSnowflakes.splice(0, clickSnowflakes.length - MAX_CLICK_SNOWFLAKES)

    if (cursorFeedbackElement) {
      cursorFeedbackElement.classList.remove('is-bursting')
      void cursorFeedbackElement.offsetWidth
      cursorFeedbackElement.classList.add('is-bursting')
    }
  }

  function drawClickSnowflake(particle: ClickSnowflake, opacity: number, scale: number): void {
    const size = particle.size * scale
    context.save()
    context.translate(particle.x, particle.y)
    context.rotate(particle.rotation)
    context.globalAlpha = opacity
    context.strokeStyle = particle.color
    context.lineWidth = Math.max(1, size * 0.17)
    context.shadowBlur = 4
    context.shadowColor = 'rgba(14, 165, 233, 0.65)'
    for (let arm = 0; arm < 6; arm += 1) {
      context.rotate(Math.PI / 3)
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(size, 0)
      context.moveTo(size * 0.58, 0)
      context.lineTo(size * 0.78, -size * 0.22)
      context.moveTo(size * 0.58, 0)
      context.lineTo(size * 0.78, size * 0.22)
      context.stroke()
    }
    context.restore()
  }

  function emitCursorSnowflakes(now: number): void {
    const inertiaX = Math.max(-1.35, Math.min(1.35, (cursorTargetX - cursorX) * 0.012))
    const inertiaY = Math.max(-0.25, Math.min(0.6, (cursorTargetY - cursorY) * 0.008))
    const particleCount = Math.random() < 0.2 ? 2 : 1

    for (let index = 0; index < particleCount; index += 1) {
      clickSnowflakes.push({
        bornAt: now,
        color: CLICK_SNOWFLAKE_COLORS[Math.floor(Math.random() * CLICK_SNOWFLAKE_COLORS.length)]!,
        lifetimeMs: 650 + Math.random() * 350,
        rotation: Math.random() * Math.PI,
        rotationVelocity: (Math.random() - 0.5) * 0.075,
        size: 2 + Math.random() * 2,
        velX: inertiaX + (Math.random() - 0.5) * 0.55,
        velY: Math.max(0.25, 0.38 + Math.random() * 0.5 + inertiaY),
        x: cursorX + (Math.random() - 0.5) * 10,
        y: cursorY + 8 + Math.random() * 5,
      })
    }

    if (clickSnowflakes.length > MAX_CLICK_SNOWFLAKES)
      clickSnowflakes.splice(0, clickSnowflakes.length - MAX_CLICK_SNOWFLAKES)
    nextCursorTrailAt = now + CURSOR_TRAIL_DELAY_MIN_MS + Math.random() * CURSOR_TRAIL_DELAY_VARIANCE_MS
  }

  function finalize(): void {
    if (stopped)
      return

    stopped = true
    cancelAnimationFrame(animationFrame)
    clearTimeout(fadeOutTimer)
    clearTimeout(hardStopTimer)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerleave', handlePointerLeave)
    window.removeEventListener('click', handlePageClick)
    window.removeEventListener('resize', resizeCanvas)
    document.documentElement.classList.remove('forum-festival-snow-cursor')
    cursorElement?.remove()
    canvas.remove()
    resolveFinished()
  }

  function stop(stopOptions: ForumFestivalEffectStopOptions = {}): void {
    if (stopped || fadingOut)
      return

    if (!stopOptions.fadeOut) {
      finalize()
      return
    }

    fadingOut = true
    canvas.style.transition = 'opacity 250ms ease-out'
    if (cursorElement)
      cursorElement.style.opacity = '0'
    requestAnimationFrame(() => canvas.style.opacity = '0')
    fadeOutTimer = window.setTimeout(finalize, 260)
  }

  function handleVisibilityChange(): void {
    if (document.hidden)
      finalize()
  }

  function render(now: number): void {
    if (stopped)
      return

    const elapsedMs = now - startedAt
    if (elapsedMs >= options.durationMs + MAX_NATURAL_TAIL_MS) {
      finalize()
      return
    }

    const settling = elapsedMs >= Math.max(0, options.durationMs - SETTLE_DURATION_MS)
    const frameScale = Math.min(Math.max((now - previousFrameAt) / FRAME_DURATION, 0.25), 2.5)
    previousFrameAt = now
    if (cursorElement && cursorPositionInitialized) {
      const followAmount = 1 - CURSOR_FOLLOW_RETAINED_DISTANCE ** frameScale
      cursorX += (cursorTargetX - cursorX) * followAmount
      cursorY += (cursorTargetY - cursorY) * followAmount
      cursorElement.style.transform = `translate3d(${cursorX - 16}px, ${cursorY - 16}px, 0)`
      if (!settling && !fadingOut && now >= nextCursorTrailAt)
        emitCursorSnowflakes(now)
    }
    context.clearRect(0, 0, viewportWidth, viewportHeight)
    context.shadowBlur = 2
    context.shadowColor = 'rgba(14, 116, 144, 0.35)'

    for (const flake of flakes) {
      if (!flake.active)
        continue

      const dx = flake.x - pointerX
      const dy = flake.y - pointerY
      const distance = Math.hypot(dx, dy)

      if (!settling && distance > 0 && distance < POINTER_INFLUENCE_RADIUS) {
        const force = POINTER_INFLUENCE_RADIUS / (distance * distance)
        const deltaVelocity = force / 2 * frameScale
        flake.velX += deltaVelocity * dx / distance
        flake.velY += deltaVelocity * dy / distance
      }
      else {
        const horizontalDamping = 0.98 ** frameScale
        flake.velX = flake.windSpeed + (flake.velX - flake.windSpeed) * horizontalDamping
        flake.velY = Math.max(flake.velY, flake.speed)
        flake.step += 0.05 * frameScale
        flake.velX += Math.cos(flake.step) * flake.stepSize * frameScale
      }

      flake.x += flake.velX * frameScale
      flake.y += flake.velY * frameScale

      if (flake.y > viewportHeight + flake.size) {
        if (settling) {
          flake.active = false
          continue
        }
        resetFlake(flake)
      }
      else if (flake.x > viewportWidth + flake.size || flake.x < -flake.size) {
        if (settling) {
          flake.active = false
          continue
        }
        resetFlake(flake)
      }

      context.beginPath()
      context.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`
      context.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2)
      context.fill()
    }

    for (let index = clickSnowflakes.length - 1; index >= 0; index -= 1) {
      const particle = clickSnowflakes[index]
      if (!particle)
        continue

      const ageMs = now - particle.bornAt
      const progress = ageMs / particle.lifetimeMs
      if (progress >= 1) {
        clickSnowflakes.splice(index, 1)
        continue
      }

      particle.velX *= 0.985 ** frameScale
      particle.velY += 0.022 * frameScale
      particle.x += particle.velX * frameScale
      particle.y += particle.velY * frameScale
      particle.rotation += particle.rotationVelocity * frameScale
      const entrance = Math.min(1, ageMs / 75)
      const opacity = entrance * (1 - progress) ** 1.45
      drawClickSnowflake(particle, opacity, 0.7 + entrance * 0.3)
    }

    if (settling && flakes.every(flake => !flake.active)) {
      stop()
      return
    }
    animationFrame = requestAnimationFrame(render)
  }

  resizeCanvas()
  for (let index = 0; index < FLAKE_COUNT; index += 1) {
    const flake = {} as Snowflake
    resetFlake(flake, true)
    flakes.push(flake)
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  window.addEventListener('pointerleave', handlePointerLeave)
  window.addEventListener('click', handlePageClick)
  window.addEventListener('resize', resizeCanvas, { passive: true })
  animationFrame = requestAnimationFrame(render)
  hardStopTimer = window.setTimeout(finalize, options.durationMs + MAX_NATURAL_TAIL_MS + 100)

  return { finished, stop }
}
