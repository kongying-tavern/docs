export const isDEV = (callback: Function, ...args: any[]): boolean => {
  if (!__DEV__) return false

  if (args) {
    callback(...args)
  } else {
    callback()
  }
  return true
}
