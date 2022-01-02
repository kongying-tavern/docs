export const isDEV = (callback: Function, ...args: any[]): boolean => {
  if (!__VUEPRESS_DEV__) return false

  if (args) {
    callback(...args)
  } else {
    callback()
  }
  return true
}
