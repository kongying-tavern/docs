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

export default instance
