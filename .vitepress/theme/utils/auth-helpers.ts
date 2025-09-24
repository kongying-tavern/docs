/**
 * 认证相关的工具函数，消除重复的验证逻辑
 */

import type { ComputedRef } from 'vue'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed } from 'vue'
import { toast } from 'vue-sonner'
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

  /**
   * 检查SSO token是否有效
   */
  isSSOTokenValid(target: 'interKnot'): boolean {
    return this.userAuth.isSSOTokenValid(target).value
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
   * 获取带认证的API参数
   */
  getAuthenticatedParams(): { accessToken: string } | Record<string, never> {
    return this.accessToken ? { accessToken: this.accessToken } : {}
  }

  /**
   * 检查当前用户是否为指定用户
   */
  isCurrentUser(username: string): boolean {
    const user = this.userInfoStore.info
    return user?.login === username || user?.username === username
  }

  /**
   * 创建响应式的登录状态computed
   */
  createLoginStatusComputed(): ComputedRef<boolean> {
    return computed(() => this.userAuth.isTokenValid)
  }

  /**
   * 创建响应式的用户信息computed
   */
  createUserInfoComputed() {
    return computed(() => this.userInfoStore.info)
  }

  /**
   * 创建响应式的访问令牌computed
   */
  createAccessTokenComputed(): ComputedRef<string | null> {
    return computed(() => {
      return this.userAuth.auth?.accessToken ?? null
    })
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

  /**
   * Token守卫 - 检查是否有有效token
   */
  requireToken: (): string | null => {
    return useAuthHelper().ensureAccessToken()
  },

  /**
   * 用户身份守卫 - 检查是否为指定用户
   */
  requireUser: (username: string, message?: string): boolean => {
    const helper = useAuthHelper()
    if (!helper.ensureLoggedIn(message)) {
      return false
    }
    return helper.isCurrentUser(username)
  },
}

/**
 * 响应式认证状态hooks
 */
export function useAuthState() {
  const helper = useAuthHelper()

  return {
    isLoggedIn: helper.createLoginStatusComputed(),
    userInfo: helper.createUserInfoComputed(),
    accessToken: helper.createAccessTokenComputed(),
    helper,
  }
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

  /**
   * 条件执行 - 仅在登录状态下执行
   */
  ifLoggedIn<T>(operation: () => T): T | undefined {
    const helper = useAuthHelper()
    return helper.isLoggedIn ? operation() : undefined
  },
}
