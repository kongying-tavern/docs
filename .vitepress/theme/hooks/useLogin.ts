import { oauth } from '@/apis/forum/gitee'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useData, useRouter, withBase } from 'vitepress'
import { toast } from 'vue-sonner'
import { removeQueryParam } from '@/utils'
import { refAutoReset, useStorage } from '@vueuse/core'
import { ref } from 'vue'

const REDIRECT_LINK_KEY = 'redirect-link'
const REQUIRED_LOGIN_PAGES = ['/feedback/user']

const useLogin = () => {
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

  type CredentialsParams = {
    method: keyof typeof LoginMethodsMap
  }

  initialize()

  async function initialize() {
    if (getLoginStatus() || !authCode) return

    isAuthenticating.value = true
    const redirectState = redirectToNoRequiredLoginPage()

    const auth = await oauth.getToken(authCode)

    if (!auth) {
      toast.error(theme.value.forum.auth.loginFail)
      isAuthenticating.value = false
      return
    }

    userAuth.setAuth(auth)
    await userInfo.refreshUserInfo()
    userAuth.ensureTokenRefreshMission()
    if (!redirectState) await go(cachedRedirectUrl.value)
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
    } else {
      toast.info(theme.value.forum.auth.loginFail)
    }
  }

  function oauthLogin() {
    if (location.hash !== 'login-alert') return (location.hash = 'login-alert')
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

  function logout(revoke = false) {
    // TODO: revoke
    userAuth.clearAuth()
    userInfo.clearUserInfo()
    toast.success(theme.value.forum.auth.logoutSuccess)
  }

  function redirectToNoRequiredLoginPage() {
    if (
      REQUIRED_LOGIN_PAGES.some(
        (page) => !cachedRedirectUrl.value.includes(page),
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
    if (!location.search.includes('code')) return null
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
