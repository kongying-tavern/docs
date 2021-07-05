export const isDEV = (callback: Function, ...args: any[]): boolean => {
  if (!globalThis.__DEV__) return false

  if (args) {
    callback(...args)
  } else {
    callback()
  }
  return true
}
