import type { LocalAuth } from '@/stores/useUserAuth'
import { oauth } from '@/apis/forum/gitee'
import { oauth as interKnotOauth } from '@/apis/inter-knot.site'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { removeQueryParam } from '@/utils'
import { AuthError } from '@/utils/auth-errors'
import { refAutoReset, useStorage } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const REDIRECT_LINK_KEY = 'redirect-link'
const HISTORY_LENGTH_KEY = 'auth-history-length'

function useLogin() {
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const authCode = getAuthCodeFromURL()
  const isAuthenticating = ref(false)

  const redirectUrl = refAutoReset(withBase('/'), 1000 * 60 * 5)
  const storedRedirectUrl = useStorage(REDIRECT_LINK_KEY, redirectUrl, sessionStorage)

  const { go } = useRouter()
  const { theme, localeIndex } = useData()

  const LoginMethodsMap = {
    Oauth: handleOAuthLoginStart,
    Password: handlePasswordLogin,
  } as const

  interface CredentialsParams {
    method: keyof typeof LoginMethodsMap
  }

  initOAuthFlow()

  async function initOAuthFlow() {
    if (isLoggedIn() || !authCode)
      return

    isAuthenticating.value = true

    try {
      const result = await oauth.getToken(authCode, localeIndex.value)

      if (!result.success) {
        const errorMsg = AuthError.isAuthError(result.error)
          ? result.error.getUserMessage()
          : theme.value.forum.auth.loginFail
        toast.error(errorMsg)
        return
      }

      // Convert ForumAPI.Auth to LocalAuth by adding expiresTime
      const authWithExpiresTime: LocalAuth = {
        ...result.data,
        expiresTime: Date.now() + result.data.expiresIn * 1000,
      }
      await storeUserSession(authWithExpiresTime)
      await refreshInterKnotSSOToken()

      handlePostLogin()
      await redirectToOriginalPage()
    }
    catch (error) {
      console.error('[Login]: OAuth流程失败', error)
      toast.error(theme.value.forum.auth.loginFail)
    }
    finally {
      isAuthenticating.value = false
    }
  }

  async function redirectToOriginalPage() {
    try {
      const redirectUrl = storedRedirectUrl.value || withBase('')

      // 使用简单的replace方式跳转，避免复杂的history操作
      window.history.replaceState({}, '', redirectUrl)
      await go(redirectUrl)

      // 清理存储的状态
      sessionStorage.removeItem(HISTORY_LENGTH_KEY)
      storedRedirectUrl.value = withBase('/')
    }
    catch (error) {
      console.warn('[Login]: 重定向失败，回退到首页', error)
      await go(withBase('/'))
    }
  }

  async function storeUserSession(auth: LocalAuth) {
    userAuth.setAuth(auth)
    await userInfo.refreshUserInfo()
    userAuth.ensureTokenRefreshMission()
  }

  async function refreshInterKnotSSOToken() {
    try {
      const { isSSOTokenValid, setSSOAuth } = userAuth
      const accessToken = userAuth.auth?.accessToken

      // 检查主token是否有效且非空
      if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
        return
      }

      // 检查SSO token是否需要刷新
      if (!isSSOTokenValid('interKnot').value) {
        const result = await interKnotOauth.refreshToken(accessToken)

        if (!result.success) {
          const errorMsg = AuthError.isAuthError(result.error)
            ? result.error.getUserMessage()
            : theme.value.forum.auth.loginFail
          toast.error(`inter-knot.site: ${errorMsg}`)
          return
        }

        // 验证返回数据的完整性
        const { accessToken: newAccessToken, expiresTime, createdAt, expiresIn } = result.data
        if (!newAccessToken) {
          toast.error('inter-knot.site: 刷新token失败，返回数据不完整')
          return
        }

        setSSOAuth('interKnot', {
          accessToken: newAccessToken,
          expiresTime,
          createdAt,
          expiresIn,
        })
      }
    }
    catch (error) {
      console.warn('[Login]: InterKnot SSO刷新失败，主认证仍有效', error)
    }
  }

  function handlePostLogin() {
    if (isLoggedIn()) {
      toast.success(theme.value.forum.auth.loginSuccess)
    }
  }

  function handleOAuthLoginStart() {
    isAuthenticating.value = true
    redirectUrl.value = location.href
    sessionStorage.setItem(HISTORY_LENGTH_KEY, window.history.length.toString())
    oauth.redirectAuth(localeIndex.value)
  }

  function handlePasswordLogin() {
    // TODO: Implement password login
  }

  function login(credentials: CredentialsParams) {
    return LoginMethodsMap[credentials.method]()
  }

  function logout() {
    userAuth.logout()
    userInfo.clearUserInfo()
    toast.success(theme.value.forum.auth.logoutSuccess)
  }

  function signup() {
    window.open('https://gitee.com/signup')
  }

  function getAuthCodeFromURL(): string | null {
    const code = new URLSearchParams(location.search).get('code')
    if (code) {
      removeQueryParam('code')
      // OAuth流程开始时，清理之前的redirect URL缓存
      localStorage.removeItem('oauth-redirect-url')
    }
    return code
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
    login,
    logout,
    signup,
    getAccessToken,
    getUserInfo,
    redirectAuth: handleOAuthLoginStart,
    isAuthenticating,
  }
}

export default useLogin
