export interface ForumFestivalEffectOptions {
  durationMs: number
  fireworkStyle?: 'new-year' | 'spring-festival'
  palette?: readonly string[]
}

export interface ForumFestivalEffectController {
  finished: Promise<void>
  stop: (options?: ForumFestivalEffectStopOptions) => void
}

export interface ForumFestivalEffectStopOptions {
  fadeOut?: boolean
}

export interface ForumFestivalEffectModule {
  startFestivalEffect: (options: ForumFestivalEffectOptions) => ForumFestivalEffectController
}
