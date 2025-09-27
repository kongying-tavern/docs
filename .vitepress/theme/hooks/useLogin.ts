import type { LocalAuth } from '@/stores/useUserAuth'
import { refAutoReset, useStorage } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { oauth } from '@/apis/forum/gitee'
import { oauth as interKnotOauth } from '@/apis/inter-knot.site'
import { useAuthProgress } from '@/composables/useAuthProgress'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { removeQueryParam } from '@/utils'
import { AuthError, AuthErrorType } from '@/utils/auth-errors'
import { useLocalized } from './useLocalized'

const REDIRECT_LINK_KEY = 'redirect-link'
const HISTORY_LENGTH_KEY = 'auth-history-length'

function useLogin() {
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const { message } = useLocalized()
  const authCode = getAuthCodeFromURL()
  const isAuthenticating = ref(false)

  const authProgress = useAuthProgress()

  const redirectUrl = refAutoReset(withBase('/'), 1000 * 60 * 5)
  const storedRedirectUrl = useStorage(REDIRECT_LINK_KEY, redirectUrl, import.meta.env.SSR ? undefined : sessionStorage)

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
      await performOAuthSteps()
      handlePostLogin()
      await redirectToOriginalPage()
    }
    catch (error) {
      console.error('[Login]: OAuth flow failed', error)
    }
    finally {
      isAuthenticating.value = false
    }
  }

  async function performOAuthSteps() {
    authProgress.setStep('init')
    await new Promise(resolve => setTimeout(resolve, 300))
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
    const authWithExpiresTime: LocalAuth = {
      ...result.data,
      expiresTime: Date.now() + result.data.expiresIn * 1000,
    }
    await storeUserSession(authWithExpiresTime)
    authProgress.completeStep('session')

    authProgress.setStep('sso')
    await refreshInterKnotSSOToken()
    authProgress.completeStep('sso')

    authProgress.setStep('redirect')
    return 'success'
  }

  async function redirectToOriginalPage() {
    try {
      const redirectUrl = storedRedirectUrl.value || withBase('')

      window.history.replaceState({}, '', redirectUrl)
      await go(redirectUrl)
      sessionStorage.removeItem(HISTORY_LENGTH_KEY)
      storedRedirectUrl.value = withBase('/')
    }
    catch (error) {
      console.warn('[Login]: Redirect failed, falling back to home', error)
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
          toast.error(message.value.forum.errors.ssoRefreshTokenFailed)
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
      console.warn('[Login]: InterKnot SSO refresh failed, main auth still valid', error)
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
    if (import.meta.env.SSR) {
      return null
    }

    const code = new URLSearchParams(location.search).get('code')
    if (code) {
      removeQueryParam('code')
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
    authProgress,
  }
}

export default useLogin
