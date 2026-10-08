/**
 * 认证相关的工具函数，消除重复的验证逻辑
 */

import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'
import { AuthError, AuthErrorType } from '~/services/authErrors'
import { toast } from '~/services/telemetry/toast'

export class AuthHelper {
  private static _instance: AuthHelper
  private userAuth = useUserAuthStore()
  private userInfoStore = useUserInfoStore()

  private constructor() {}

  static getInstance(): AuthHelper {
    if (!AuthHelper._instance) {
      AuthHelper._instance = new AuthHelper()
    }
    return AuthHelper._instance
  }

  get isLoggedIn(): boolean {
    return this.userAuth.isTokenValid
  }

  get accessToken(): string | null {
    return this.userAuth.auth?.accessToken ?? null
  }

  get userInfo() {
    return this.userInfoStore.info
  }

  requireLogin(message?: string): void {
    if (message) {
      toast.info(message)
    }
    location.hash = 'login-alert'
  }

  ensureLoggedIn(message?: string): boolean {
    if (!this.isLoggedIn) {
      this.requireLogin(message)
      return false
    }
    return true
  }

  /**
   * 检查是否有有效的访问令牌
   * @param throwError 是否抛出错误而不是返回false
   */
  ensureAccessToken(throwError = false): string | null {
    if (!this.accessToken) {
      if (throwError) {
        throw new AuthError(
          AuthErrorType.TOKEN_MISSING,
          '缺少访问令牌',
        )
      }
      return null
    }
    return this.accessToken
  }

  isCurrentUser(username: string): boolean {
    const user = this.userInfoStore.info
    return user?.login === username || user?.username === username
  }
}

export const useAuthHelper = () => AuthHelper.getInstance()

export const authGuards = {
  requireLogin: (message?: string): boolean => {
    return useAuthHelper().ensureLoggedIn(message)
  },
}

export const withAuth = {
  async execute<T>(
    operation: (token: string) => Promise<T>,
    options?: {
      loginMessage?: string
      errorMessage?: string
    },
  ): Promise<T | null> {
    const helper = useAuthHelper()

    if (!helper.ensureLoggedIn(options?.loginMessage)) {
      return null
    }

    const token = helper.ensureAccessToken()
    if (!token) {
      if (options?.errorMessage) {
        toast.error(options.errorMessage)
      }
      return null
    }

    try {
      return await operation(token)
    }
    catch (error) {
      if (options?.errorMessage) {
        toast.error(options.errorMessage, { error })
      }
      throw error
    }
  },
}
