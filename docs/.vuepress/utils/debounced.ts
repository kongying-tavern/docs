/**
 * A function that emits a side effect.
 */
export type Procedure = (...args: any[]) => any

export type Options<TT> = {
  isImmediate?: boolean
  maxWait?: number
  callback?: (data: TT) => void
}

export interface DebouncedFunction<F extends Procedure> {
  (this: ThisParameterType<F>, ...args: Parameters<F>): Promise<ReturnType<F>>
  cancel: (reason?: any) => void
}

/**
 * @description: Debounce creates a new function , which when called will delay the invocation of the original function until milliseconds, BUT drops previous pending delayed emissions if a new invocation is made before milliseconds.gfnn
 * @param {Function} originalFunction the function which we want to debounce
 * @param {number} waitMilliseconds how many seconds must pass after most recent function call, for the original function to be called
 * @param {isImmediate: boolean, maxWait: number, callback: Function} {options}
 * @return {DebouncedFunction<F>}
 */
export function debounce<F extends Procedure>(
  func: F,
  waitMilliseconds = 50,
  options: Options<ReturnType<F>> = {}
): DebouncedFunction<F> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const isImmediate = options.isImmediate ?? false
  const callback = options.callback ?? false
  const maxWait = options.maxWait
  let lastInvokeTime = Date.now()

  let promises: {
    resolve: (x: ReturnType<F>) => void
    reject: (reason?: any) => void
  }[] = []

  function nextInvokeTimeout() {
    if (maxWait !== undefined) {
      const timeSinceLastInvocation = Date.now() - lastInvokeTime

      if (timeSinceLastInvocation + waitMilliseconds >= maxWait) {
        return maxWait - timeSinceLastInvocation
      }
    }

    return waitMilliseconds
  }

  const debouncedFunction = function (
    this: ThisParameterType<F>,
    ...args: Parameters<F>
  ) {
    const context = this
    return new Promise<ReturnType<F>>((resolve, reject) => {
      const invokeFunction = function () {
        timeoutId = undefined
        lastInvokeTime = Date.now()
        if (!isImmediate) {
          const result = func.apply(context, args)
          callback && callback(result)
          promises.forEach(({ resolve }) => resolve(result))
          promises = []
        }
      }

      const shouldCallNow = isImmediate && timeoutId === undefined

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(invokeFunction, nextInvokeTimeout())

      if (shouldCallNow) {
        const result = func.apply(context, args)
        callback && callback(result)
        return resolve(result)
      }
      promises.push({ resolve, reject })
    })
  }

  /**
   * @description: The returned debounced function can be cancelled but by calling on it.cancel()
   * @param {any} reason
   * @return {void}
   */
  debouncedFunction.cancel = function (reason?: any): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
    promises.forEach(({ reject }) => reject(reason))
    promises = []
  }

  return debouncedFunction
}
