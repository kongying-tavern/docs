import { useNotificationStore } from '../stores'
// @unocss-include
const toast = useNotificationStore()

export const addInfoToast = () => {}

export const addSuccessToast = () => {}

export const addWarningToast = (
  id: string = Date(),
  title: string,
  body: string,
) => {
  return toast.add({
    id: id,
    icon: 'i-custom-badge-check',
    title: '请求失败',
  })
}

export const addDangerToast = () => {}

export const addPrimaryToast = () => {}
