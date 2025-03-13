export namespace INTER_KNOT {
  export type ReactionState = 'like' | 'dislike'

  export interface ReactionResponse {
    statusCode: number
    statusMessage?: string
    data: {
      reaction: {
        id: number
        url: string
        likeCount: number
        dislikeCount: number
        clickCount: number
        createdAt: string
        lastUpdatedAt: string
      }
      state: ReactionState
    }
  }

  export type AllowedImageType = 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp'

  export interface ImageResponse {
    statusCode: number
    statusMessage?: string
    data: {
      pathname: string
      contentType: string
      size: number
      httpEtag: string
      uploadedAt: string
      httpMetadata: {
        contentType: string
      }
      customMetadata: Record<string, never>
    }
  }

  export interface LogoutResponse {
    statusCode: number
    statusMessage?: string
  }

  export interface AuthResponse {
    statusCode: number
    statusMessage?: string
    data: {
      userId: string
      id: number
      createdAt: string
      provider: 'gitee'
      token: string
      expiresAt: string
      updatedAt: string
    }
  }

  export interface TranslateResponse {
    statusCode: number
    statusMessage?: string
    data: {
      translatedText: string
      translatedTextLength: number
      sourceLanguage: string
      targetLanguage: string
    }
  }

  export interface LanguageResponse {
    statusCode: number
    statusMessage?: string
    data: {
      languages: {
        code: string
        name: string
      }[]
    }
  }
}
