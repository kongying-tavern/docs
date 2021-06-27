import axios, { AxiosInstance } from 'axios'
import type { VNode } from 'vue'
import { ElMessage } from 'element-plus'
import type { MessageType } from 'element-plus/lib/el-message/src/types'
import NProgress from 'NProgress'
import qs from 'qs'

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
    NProgress.start()
    return request
  },
  (error) => {
    const response = error.response
    let result = 'null'
    switch (response?.status) {
      case 403:
        result = '无权限'
        break
      case 500:
        result = '服务器错误'
        break
      default:
        break
    }
    tips(result, 'error')
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response) => {
    NProgress.done()
    return response
  },
  (error) => {
    NProgress.done()
    tips('error', 'error')
    return Promise.reject(error || { message: error.message })
  }
)

const tips = (message: string | VNode, type?: MessageType) => {
  const thisElMessage = ElMessage({
    duration: 3000,
    center: true,
    offset: 20,
    type: type || 'warning',
    message,
    customClass: 'axios_elMessage',
    showClose: true,
    onClose: () => {
      console.log('close', thisElMessage)
    },
  })
  return thisElMessage
}

export default instance
