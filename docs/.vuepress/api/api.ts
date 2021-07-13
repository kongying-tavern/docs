import instance from './http'

export const gitee = instance.post(
  '8.129.180.37:8089/api/oauth/token/social?access_token=63086d78412df39b386f7e5a7cd8d55c',
  {
    headers: { Authorization: 'Basic YXBwOmFwcA==' },
  }
)
