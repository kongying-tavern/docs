/**
 * 认证相关的工具函数，消除重复的验证逻辑
 */

import { toast } from 'vue-sonner'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { AuthError, AuthErrorType } from './auth-errors'

/**
 * 认证状态工具类
 */
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

  /**
   * 检查当前是否已登录
   */
  get isLoggedIn(): boolean {
    return this.userAuth.isTokenValid
  }

  /**
   * 获取当前访问令牌
   */
  get accessToken(): string | null {
    return this.userAuth.auth?.accessToken ?? null
  }

  /**
   * 获取当前用户信息
   */
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

  /**
   * 检查当前用户是否为指定用户
   */
  isCurrentUser(username: string): boolean {
    const user = this.userInfoStore.info
    return user?.login === username || user?.username === username
  }
}

/**
 * 获取认证助手实例的便捷函数
 */
export const useAuthHelper = () => AuthHelper.getInstance()

/**
 * 便捷的认证检查函数
 */
export const authGuards = {
  /**
   * 登录守卫 - 检查是否已登录
   */
  requireLogin: (message?: string): boolean => {
    return useAuthHelper().ensureLoggedIn(message)
  },
}

/**
 * 带认证的操作执行器
 */
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
        toast.error(options.errorMessage)
      }
      throw error
    }
  },
}
