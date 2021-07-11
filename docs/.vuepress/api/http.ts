import axios, { AxiosInstance } from 'axios'
import { ElMessage } from 'element-plus'
import qs from 'qs'

import type { MessageType } from 'element-plus/lib/el-message/src/types'
import type { VNode } from 'vue'

const instance: AxiosInstance = axios.create({
  timeout: 5000,
  baseURL: 'https://yuanshen.site/docs/',
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
  transformRequest: [(data) => JSON.stringify(data)],
})

instance.interceptors.request.use(
  (request) => {
    return request
  },
  (error) => {
    const response = error['response']
    let errorMessage = ''
    switch (response?.status) {
      case 401:
        errorMessage = '未授权，请重新登录。'
        break
      case 403:
        errorMessage = '拒绝访问。'
        break
      case 404:
        errorMessage = '请求错误，未找到该资源。'
        break
      case 500:
        errorMessage = '服务器错误。'
        break
      case 504:
        errorMessage = '网络超时。'
        break
      default:
        errorMessage = `⚠️请求错误 ${response['response']}}`
        break
    }
    tips(errorMessage, 'error')
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    tips('error', 'error')
    return Promise.reject(error || { message: error.message })
  }
)

const tips = (
  message: string | VNode,
  type: MessageType = 'warning',
  isCenter = true
) => {
  const thisElMessage = ElMessage({
    duration: 3000,
    center: isCenter,
    offset: 20,
    type: type,
    message,
    customClass: 'axios_elMessage',
    showClose: true,
    onClose: () => {
      console.log('close', this)
    },
  })
  return thisElMessage
}

export default instance
