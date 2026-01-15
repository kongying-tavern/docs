import type { INTER_KNOT } from './api'
import type { SSOAuth } from '@/stores/useUserAuth'

export const ASSETS_URL_PREFIX = 'https://webp.assets.interknot.site/'

export function normalizeImage(image: INTER_KNOT.ImageResponse) {
  return {
    state: image.statusCode === 200,
    message: image.statusMessage || '',
    data: {
      id: image.data.pathname,
      link: `${ASSETS_URL_PREFIX}${image.data.pathname}`,
      fileSize: image.data.size,
      originName: image.data.pathname,
    },
  }
}

export async function signToken(token: string, nonce: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(nonce)
  const data = encoder.encode(`${token}:${nonce}`)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', key, data)

  return Array.from(new Uint8Array(signature))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function normalizeSSOAuth(auth: INTER_KNOT.AuthResponse): SSOAuth {
  const createdAt = new Date(auth.data.createdAt).getTime()
  const expiresAt = new Date(auth.data.expiresAt).getTime()
  const now = Date.now()
  const expiresIn = Math.max(0, expiresAt - now) // 确保不为负数

  console.debug('[SSO Auth]: 解析SSO认证数据', {
    token: auth.data.token ? '存在' : '缺失',
    createdAt: new Date(createdAt).toLocaleString(),
    expiresAt: new Date(expiresAt).toLocaleString(),
    expiresIn: `${Math.round(expiresIn / 1000 / 60)}分钟`,
    isValid: expiresAt > now,
  })

  if (expiresAt <= now) {
    console.warn('[SSO Auth]: SSO token已过期，即将返回的数据可能无效')
  }

  return {
    accessToken: auth.data.token,
    createdAt,
    expiresIn: Math.round(expiresIn / 1000), // 转为秒
    expiresTime: expiresAt,
  }
}

export function generateRandomString(length: number) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  return Array.from(array)
    .map(byte => charset[byte % charset.length])
    .join('')
}
