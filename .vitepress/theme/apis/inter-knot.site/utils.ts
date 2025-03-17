import type { SSOAuth } from '@/stores/useUserAuth'
import type { INTER_KNOT } from './api'

export const ASSETS_URL_PREFIX = 'https://assets.webp.inter-knot.site/'

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
  return {
    accessToken: auth.data.token,
    createdAt: new Date(auth.data.createdAt).getTime(),
    expiresIn: new Date(auth.data.expiresAt).getTime() - new Date().getTime(),
    expiresTime: new Date(auth.data.expiresAt).getTime(),
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
