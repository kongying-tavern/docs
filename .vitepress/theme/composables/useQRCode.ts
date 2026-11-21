import type { MaybeRefOrGetter } from 'vue'
import { isClient } from '@vueuse/core'
import QRCode from 'qrcode'
import { useData } from 'vitepress'
import { shallowRef, toValue, watch } from 'vue'

/** 主题配色：透明底融入页面底色；qrcode 只接受 hex（'transparent' 会抛 Invalid hex color） */
const THEME_QR_COLORS = {
  dark: { dark: '#ffffff', light: '#00000000' },
  light: { dark: '#111111', light: '#00000000' },
} as const

/**
 * 主题感知的二维码 hook（替代 @vueuse/integrations useQRCode）。
 * 原 hook 只监听 text、不重绘 options，夜间模式切换不会刷新，故额外监听 isDark。
 */
export function useQRCode(
  text: MaybeRefOrGetter<string>,
  options?: QRCode.QRCodeToDataURLOptions,
) {
  const { isDark } = useData()
  const src = shallowRef('')

  watch(
    [() => toValue(text), isDark],
    async () => {
      const value = toValue(text)
      if (!isClient || !value)
        return
      const themeColors = isDark.value ? THEME_QR_COLORS.dark : THEME_QR_COLORS.light
      src.value = await QRCode.toDataURL(value, {
        ...options,
        color: { ...themeColors, ...options?.color },
      })
    },
    { immediate: true },
  )

  return src
}
