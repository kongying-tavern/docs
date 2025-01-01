import { oauth } from '@/apis/forum/gitee'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useData } from 'vitepress'
import { toast } from 'vue-sonner'

const useLogin = () => {
  const userInfo = useUserInfoStore()
  const userAuth = useUserAuthStore()
  const authCode = getAuthCode()

  const { theme } = useData()

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

    userAuth.setAuth(await oauth.getToken(authCode))
    await userInfo.refreshUserInfo()
    userAuth.ensureTokenRefreshMission()
    afterLogin()
  }

  function signup() {
    return window.open('https://gitee.com/signup')
  }

  function login(credentials: CredentialsParams) {
    const result = LoginMethodsMap[credentials.method]()
    return result
  }

  function afterLogin() {
    if (getLoginStatus()) {
      toast.success(theme.value.forum.auth.loginSuccess)
    } else {
      toast.info(theme.value.forum.auth.loginFail)
    }
  }

  function oauthLogin() {
    if (location.hash !== 'login-alert') return (location.hash = 'login-alert')
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
    return location.search.match(/code=[^&]+/)?.[0]?.split('=')?.[1]
  }

  return {
    login,
    logout,
    signup,
    getAccessToken,
    getUserInfo,
  }
}

export default useLogin
