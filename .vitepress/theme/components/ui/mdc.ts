// The ui components Markdown may use as MDC tags: `<Button />`, `<Emoji :code="..." />`.
// The barrel in `./index.ts` exports the whole layer; this file is the deliberate subset.
// Named exports only: the metadata plugin collects tag names with a regex over
// `export { ... } from '...'`. An `export *` matches nothing, so the allowlist comes
// back empty and contributes no tags to the MDC registry. Nothing imports this module,
// so its `.vue` re-exports never reach the native Node module graph. A tag also needs
// `app.component()` in `theme/index.ts` to resolve at render time.
export { AccordionPanels } from './accordion/index.ts'
export { Avatar } from './avatar/index.ts'
export { Button } from './button/index.ts'
export { Divider } from './divider/index.ts'
export { Emoji, EmojiPicker } from './emoji/index.ts'
export { InputPlaceholders } from './input-placeholders/index.ts'
export { LazyImage } from './lazy-image/index.ts'
export { LinkGrid } from './link-grid/index.ts'
export { MentionPicker } from './mention-picker/index.ts'
export { Separator } from './separator/index.ts'
export { User } from './user/index.ts'
