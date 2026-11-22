/** 主题配色：透明底融入页面底色；qrcode 只接受 hex（'transparent' 会抛 Invalid hex color） */
export const THEME_QR_COLORS = {
  dark: { dark: '#ffffff', light: '#00000000' },
  light: { dark: '#111111', light: '#00000000' },
} as const
