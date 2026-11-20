/** 一条 emoji 记录：预置包名、占位符、字符本体与尺寸。 */
export interface EmojiItem {
  preset: string
  emojiPlaceholder: string
  emoji: string
  width: number
  height: number
}
