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
const REQUIRED_LOGIN_PAGES = ['/feedback/user', '/feedback/', '/feedback/topic']

function useLogin() {
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const authCode = getAuthCode()
  const redirectUrl = refAutoReset(withBase('/'), 1000 * 60 * 5)
  const cachedRedirectUrl = useStorage(
    REDIRECT_LINK_KEY,
    redirectUrl,
    sessionStorage,
  )
  const isAuthenticating = ref<boolean>(false)

  const { go } = useRouter()
  const { theme, localeIndex } = useData()

  const LoginMethodsMap = {
    Oauth: oauthLogin,
    Password: passwordLogin,
  } as const

  interface CredentialsParams {
    method: keyof typeof LoginMethodsMap
  }

  initialize()

  async function initialize() {
    if (getLoginStatus() || !authCode)
      return

    isAuthenticating.value = true
    const redirectState = redirectToNoRequiredLoginPage()

    const [error, auth] = await oauth.getToken(authCode)

    if (error || !auth) {
      toast.error(theme.value.forum.auth.loginFail)
      isAuthenticating.value = false
      afterLogin()
      return
    }

    userAuth.setAuth(auth)
    await userInfo.refreshUserInfo()
    userAuth.ensureTokenRefreshMission()
    if (!redirectState)
      await go(cachedRedirectUrl.value)
    isAuthenticating.value = false
    afterLogin()
  }

  function signup() {
    return window.open('https://gitee.com/signup')
  }

  function login(credentials: CredentialsParams) {
    const result = LoginMethodsMap[credentials.method]()
    return result
  }

  async function afterLogin() {
    if (getLoginStatus()) {
      toast.success(theme.value.forum.auth.loginSuccess)
      await refreshInterKnotToken()
    }
  }

  async function refreshInterKnotToken() {
    if (!userAuth.isSSOTokenValid('interKnot').value && userAuth.accessToken) {
      const [error, auth] = await interKnotOauth.refreshToken(userAuth.accessToken)

      if (error) {
        toast.error(`inter-knot.site: ${theme.value.forum.auth.loginFail} (${error.message})`)
        return
      }
      console.log(auth)
      userAuth.setSSOAuth('interKnot', {
        accessToken: auth.accessToken,
        expiresTime: auth.expiresTime,
        createdAt: auth.createdAt,
        expiresIn: auth.expiresIn,
      })
    }
  }

  function oauthLogin() {
    if (location.hash !== 'login-alert')
      return (location.hash = 'login-alert')
    return redirectAuth()
  }

  function redirectAuth() {
    isAuthenticating.value = true
    redirectUrl.value = location.pathname + location.hash + location.search
    oauth.redirectAuth(localeIndex.value)
  }

  function passwordLogin() {
    // TODO: password login
  }

  function logout() {
    // TODO: revoke
    userAuth.logout()
    userInfo.clearUserInfo()
    toast.success(theme.value.forum.auth.logoutSuccess)
  }

  function redirectToNoRequiredLoginPage() {
    if (
      REQUIRED_LOGIN_PAGES.some(
        page => !page.includes(cachedRedirectUrl.value),
      )
    ) {
      go(cachedRedirectUrl.value)
      return true
    }
    return false
  }

  function getLoginStatus() {
    return userAuth.isTokenValid
  }

  function getAccessToken() {
    return userAuth.accessToken
  }

  function getUserInfo() {
    return userInfo.info
  }

  function getAuthCode() {
    if (!location.search.includes('code'))
      return null
    const code = location.search.match(/code=[^&]+/)?.[0]?.split('=')?.[1]

    console.log('AuthCode:', code)

    removeQueryParam('code')
    return code
  }

  return {
    login,
    logout,
    signup,
    getAccessToken,
    getUserInfo,
    redirectAuth,
    isAuthenticating,
  }
}

export default useLogin
