import { oauth } from '@/apis/forum/gitee'
import { oauth as interKnotOauth } from '@/apis/inter-knot.site'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { removeQueryParam } from '@/utils'
import { refAutoReset, useStorage } from '@vueuse/core'
import { useData, useRouter, withBase } from 'vitepress'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const REDIRECT_LINK_KEY = 'redirect-link'
const PROTECTED_PAGES = ['/feedback']

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

    if (!isProtectedRoute())
      redirectToOriginalPage()

    const [error, auth] = await oauth.getToken(authCode)

    if (error || !auth) {
      toast.error(theme.value.forum.auth.loginFail)
      isAuthenticating.value = false
      handlePostLogin()
      return
    }

    await storeUserSession(auth)
    await refreshInterKnotSSOToken()

    redirectToOriginalPage()

    isAuthenticating.value = false
    handlePostLogin()
  }

  async function redirectToOriginalPage() {
    const redirectUrl = storedRedirectUrl.value || withBase('')
    window.history.replaceState({}, '', redirectUrl)
    return await go(redirectUrl)
  }

  function isProtectedRoute(): boolean {
    return PROTECTED_PAGES.some(page => storedRedirectUrl.value.includes(page))
  }

  async function storeUserSession(auth: any) {
    userAuth.setAuth(auth)
    await userInfo.refreshUserInfo()
    userAuth.ensureTokenRefreshMission()
  }

  async function refreshInterKnotSSOToken() {
    const { isSSOTokenValid, accessToken, setSSOAuth } = userAuth

    if (!isSSOTokenValid('interKnot').value && accessToken) {
      const [error, auth] = await interKnotOauth.refreshToken(accessToken)
      if (error) {
        toast.error(`inter-knot.site: ${theme.value.forum.auth.loginFail} (${error.message})`)
        return
      }

      setSSOAuth('interKnot', {
        accessToken: auth.accessToken,
        expiresTime: auth.expiresTime,
        createdAt: auth.createdAt,
        expiresIn: auth.expiresIn,
      })
    }
  }

  function handlePostLogin() {
    if (isLoggedIn()) {
      toast.success(theme.value.forum.auth.loginSuccess)
    }
  }

  function handleOAuthLoginStart() {
    console.info('Starting OAuth login flow...')

    isAuthenticating.value = true
    redirectUrl.value = location.href
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
    if (code)
      removeQueryParam('code')
    return code
  }

  function isLoggedIn() {
    return userAuth.isTokenValid
  }

  function getAccessToken() {
    return userAuth.accessToken
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
