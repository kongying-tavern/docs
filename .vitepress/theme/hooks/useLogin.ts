import type ForumAPI from '@/apis/forum/api'
import { useQueryCache } from '@pinia/colada'
import { createSharedComposable } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { clearApiCache, oauth, password as passwordAuth } from '@/apis/forum/gitee'
import { oauth as interKnotOauth } from '@/apis/interknot.site'
import { useAuthProgress } from '@/composables/useAuthProgress'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { removeQueryParam } from '@/utils'
import { AuthError, AuthErrorType } from '@/utils/auth-errors'
import { log, LogGroup } from '@/utils/auth-logger'
import { forumKeys } from '~/services/forum/forumQueryContracts'
import { clearLoginIntent, takeLoginIntent } from '~/services/forum/loginIntent'
import { useLocalized } from './useLocalized'

const REDIRECT_LINK_KEY = 'redirect-link'

/** 回调路径形如 /docs/callback 或 /docs/en/callback */
const CALLBACK_PATH_REGEX = /\/callback\/?$/

function isCallbackUrl(url: string): boolean {
  try {
    return CALLBACK_PATH_REGEX.test(new URL(url, location.origin).pathname)
  }
  catch {
    return false
  }
}

/**
 * 回跳目标在发起授权跳转前同步落库：靠 watcher 异步写会在页面卸载前丢失，
 * 导致回调后读不到目标而回首页。
 */
function getStoredRedirectUrl(): string {
  if (import.meta.env.SSR)
    return withBase('/')
  return sessionStorage.getItem(REDIRECT_LINK_KEY) ?? withBase('/')
}

function storeRedirectUrl(url: string): void {
  if (!import.meta.env.SSR)
    sessionStorage.setItem(REDIRECT_LINK_KEY, url)
}

function clearStoredRedirectUrl(): void {
  if (!import.meta.env.SSR)
    sessionStorage.removeItem(REDIRECT_LINK_KEY)
}

interface OAuthCallbackParams {
  code: string | null
  error: string | null
  stateValid: boolean
}

function useLogin() {
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const queryCache = useQueryCache()
  const { message } = useLocalized()
  const oauthCallback = getOAuthCallbackParams()
  const authCode = oauthCallback.code
  /** 本次页面加载是否携带 OAuth 回调参数（授权码或授权错误） */
  const hasOAuthCallback = !!(oauthCallback.code || oauthCallback.error)
  const isAuthenticating = ref(false)

  const authProgress = useAuthProgress()

  const { go } = useRouter()
  const { theme, localeIndex } = useData()

  initOAuthFlow()

  async function initOAuthFlow() {
    // 授权失败回调（如用户拒绝授权）：?error=access_denied
    if (oauthCallback.error) {
      log.error(LogGroup.LOGIN, `OAuth callback returned error: ${oauthCallback.error}`)
      authProgress.setError('token')
      await handleOAuthFailure(theme.value.forum.auth.loginFail)
      return
    }

    if (!authCode)
      return

    // 回调到达时已有有效会话（如另一标签页刚完成登录）：跳过换发，直接回跳
    if (isLoggedIn()) {
      await redirectToOriginalPage()
      await replayLoginIntent()
      return
    }

    // state 不一致说明回调可能由第三方伪造（登录 CSRF），拒绝交换 token
    if (!oauthCallback.stateValid) {
      log.error(LogGroup.LOGIN, 'OAuth state mismatch, rejecting callback')
      authProgress.setError('token')
      await handleOAuthFailure(theme.value.forum.auth.loginFail)
      return
    }

    isAuthenticating.value = true

    try {
      await performOAuthSteps()
      handlePostLogin()
      await redirectToOriginalPage()
      await replayLoginIntent()
    }
    catch (error) {
      log.error(LogGroup.LOGIN, 'OAuth flow failed', error)
      // 已知认证错误直接提示；未知错误清掉可能残留的半登录状态再提示
      const authError = AuthError.isAuthError(error) ? error : null
      await handleOAuthFailure(
        authError ? authError.getUserMessage() : theme.value.forum.auth.loginFail,
        !authError,
      )
    }
    finally {
      isAuthenticating.value = false
    }
  }

  /** 登录失败统一处理：跳回目标页提示错误；未知错误时先清空本地登录数据 */
  async function handleOAuthFailure(message: string, clearLocalAuth = false) {
    if (clearLocalAuth) {
      userAuth.logout()
      userInfo.clearUserInfo()
      clearApiCache()
    }
    toast.error(message)
    await redirectToOriginalPage()
    // 会话已建立（如 SSO 失败）按登录成功回放意图；未登录则丢弃防止误回放
    if (isLoggedIn())
      await replayLoginIntent()
    else
      clearLoginIntent()
  }

  async function performOAuthSteps() {
    authProgress.setStep('init')
    authProgress.completeStep('init')

    authProgress.setStep('token')
    if (!authCode) {
      authProgress.setError('token')
      throw new AuthError(AuthErrorType.OAUTH_CODE_MISSING, 'Authorization code not found')
    }

    const result = await oauth.getToken(authCode, localeIndex.value)
    if (!result.success) {
      authProgress.setError('token')
      throw result.error
    }
    authProgress.completeStep('token')

    authProgress.setStep('session')
    await storeUserSession(result.data)
    authProgress.completeStep('session')

    authProgress.setStep('sso')
    await refreshInterKnotSSOToken()
    authProgress.completeStep('sso')

    await refreshForumDataAfterLogin()

    authProgress.setStep('redirect')
  }

  async function redirectToOriginalPage() {
    try {
      const storedUrl = getStoredRedirectUrl()
      // 回跳目标指向回调页自身时回退首页，否则登录后回到无参数的回调页卡死
      const target = isCallbackUrl(storedUrl) ? withBase('/') : storedUrl

      window.history.replaceState({}, '', target)
      await go(target)
      clearStoredRedirectUrl()
    }
    catch (error) {
      log.warn(LogGroup.LOGIN, 'Redirect failed, falling back to home', error)
      await go(withBase('/'))
    }
  }

  /** 回放发起登录时记录的意图（如自动打开反馈表单） */
  async function replayLoginIntent(): Promise<void> {
    const intent = takeLoginIntent()
    if (intent) {
      location.hash = intent
    }
  }

  async function storeUserSession(auth: ForumAPI.Auth) {
    userAuth.setAuth(auth)
    clearApiCache()
    await userInfo.refreshUserInfo()
  }

  /** 登录身份改变请求配额后，主动重拉当前页面中包括 error 状态在内的 Forum 查询。 */
  async function refreshForumDataAfterLogin(): Promise<void> {
    try {
      await queryCache.invalidateQueries({ key: forumKeys.all }, 'all')
    }
    catch (error) {
      log.warn(LogGroup.LOGIN, 'Forum refresh after login failed', error)
    }
  }

  async function refreshInterKnotSSOToken() {
    try {
      const { isSSOTokenValid, setSSOAuth } = userAuth
      const accessToken = userAuth.auth?.accessToken

      if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
        return
      }

      if (!isSSOTokenValid('interKnot').value) {
        const result = await interKnotOauth.refreshToken(accessToken)

        if (!result.success) {
          const errorMsg = AuthError.isAuthError(result.error)
            ? result.error.getUserMessage()
            : theme.value.forum.auth.loginFail
          toast.error(`interknot.site: ${errorMsg}`)
          return
        }

        // 验证返回数据的完整性（setSSOToken 依据 expiresIn 重算 expiresTime）
        const { accessToken: newAccessToken, createdAt, expiresIn } = result.data
        if (!newAccessToken) {
          toast.error(message.value.forum.errors.ssoRefreshTokenFailed)
          return
        }

        setSSOAuth('interKnot', {
          accessToken: newAccessToken,
          createdAt,
          expiresIn,
        })
      }
    }
    catch (error) {
      log.warn(LogGroup.LOGIN, 'InterKnot SSO refresh failed, main auth still valid', error)
    }
  }

  function handlePostLogin() {
    if (isLoggedIn()) {
      toast.success(theme.value.forum.auth.loginSuccess)
    }
  }

  function showLoginAlert() {
    if (location.hash !== 'login-alert')
      return location.hash = 'login-alert'
  }

  function handleOAuthLoginStart() {
    isAuthenticating.value = true
    // 从回调页（如失败后重试）发起授权时，回跳目标存首页而非回调页自身
    storeRedirectUrl(isCallbackUrl(location.href) ? withBase('/') : location.href)
    oauth.redirectAuth(localeIndex.value)
  }

  async function handlePasswordLogin(username: string, password: string): Promise<boolean> {
    const normalizedUsername = username.trim()
    if (!normalizedUsername || !password)
      return false

    isAuthenticating.value = true
    let appliedAccessToken: string | undefined

    try {
      const [error, auth] = await passwordAuth.getToken(normalizedUsername, password)
      if (error || !auth)
        throw error ?? new Error('Gitee password login returned no authentication data')

      appliedAccessToken = auth.accessToken
      await storeUserSession(auth)
      await refreshInterKnotSSOToken()
      await refreshForumDataAfterLogin()
      handlePostLogin()
      return true
    }
    catch {
      // 只有本次登录已经写入 token 时才回滚，避免误清其他标签页刚建立的会话。
      if (appliedAccessToken && userAuth.auth?.accessToken === appliedAccessToken) {
        userAuth.logout()
        userInfo.clearUserInfo()
        clearApiCache()
      }
      log.error(LogGroup.LOGIN, 'Password login failed')
      toast.error(theme.value.forum.auth.passwordLoginFail)
      return false
    }
    finally {
      isAuthenticating.value = false
    }
  }

  /** 回调页”重试”按钮：重跑登录流程（授权码仍在时）或重新发起授权 */
  async function retryOAuthFlow() {
    authProgress.retry()

    // 上次失败发生在会话建立之后（如 SSO 同步失败）：直接补跳转到原页面
    if (isLoggedIn()) {
      authProgress.setStep('redirect')
      await redirectToOriginalPage()
      await replayLoginIntent()
      return
    }

    if (authCode && !isAuthenticating.value) {
      initOAuthFlow()
    }
    else if (!authCode) {
      handleOAuthLoginStart()
    }
  }

  function logout() {
    // 先携带 SSO token 通知服务端吊销（尽力而为），再清本地全部凭证
    userAuth.logoutFromInterKnot().catch((error) => {
      log.warn(LogGroup.LOGIN, 'InterKnot server logout failed', error)
    })
    userAuth.logout()
    userInfo.clearUserInfo()
    clearApiCache()
    toast.success(theme.value.forum.auth.logoutSuccess)
  }

  function getOAuthCallbackParams(): OAuthCallbackParams {
    const noCallback: OAuthCallbackParams = { code: null, error: null, stateValid: true }

    if (import.meta.env.SSR) {
      return noCallback
    }

    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (!code && !error) {
      return noCallback
    }

    const stateValid = oauth.validateOAuthState(params.get('state'))

    // 清理 URL 中的敏感参数，避免授权码留在地址栏/历史记录里
    removeQueryParam('code')
    removeQueryParam('state')
    removeQueryParam('error')
    removeQueryParam('error_description')
    localStorage.removeItem('oauth-redirect-url')

    return { code, error, stateValid }
  }

  function isLoggedIn() {
    return userAuth.isTokenValid
  }

  function getAccessToken() {
    return userAuth.auth?.accessToken
  }

  function getUserInfo() {
    return userInfo.info
  }

  return {
    loginWithPassword: handlePasswordLogin,
    logout,
    getAccessToken,
    getUserInfo,
    isLoggedIn,
    hasOAuthCallback,
    redirectAuth: handleOAuthLoginStart,
    isAuthenticating,
    authProgress: {
      ...authProgress,
      retry: retryOAuthFlow,
    },
    showLoginAlert,
  }
}

/** 全局共享单例：OAuth 回调流程只执行一次，所有组件消费同一份进度状态 */
export default createSharedComposable(useLogin)
