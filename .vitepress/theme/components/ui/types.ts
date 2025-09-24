// Emoji related types
export interface EmojiItem {
  emoji: string
  name: string
  category: string
  shortcodes: string[]
  tags: string[]
}

export interface EmojiCategory {
  name: string
  emojis: EmojiItem[]
}

export interface EmojiPickerProps {
  categories?: EmojiCategory[]
  searchPlaceholder?: string
  noResults?: string
}

export interface EmojiAttrs {
  'emoji': string
  'width'?: number
  'height'?: number
  'src'?: string
  'alt'?: string
  'title'?: string
  'data-emoji'?: string
}
