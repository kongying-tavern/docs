/**
 * @description: 节流
 * @param {function} callback 回调函数
 * @param {number} wait 延迟(ms)
 * @return {function}
 */
export const throttle = <R, A extends any[]>(
  callback: (...params: A) => R,
  wait: number
): Function => {
  let previous = 0,
    timer: NodeJS.Timeout | null = null
  return function (...params: A) {
    const now = +Date.now(),
      remaining = wait - (now - previous)
    if (remaining <= 0) {
      clearTimeout(Number(timer))
      timer = null
      previous = now
      // @ts-ignore
      callback.call(this, ...params)
    } else if (!timer) {
      timer = setTimeout(() => {
        clearTimeout(Number(timer))
        timer = null
        previous = +new Date()
        // @ts-ignore
        callback.call(this, ...params)
      }, remaining)
    }
  }
}
