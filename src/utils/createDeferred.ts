import { once } from 'lodash-es'

export interface Deferred<T = void> {
  promise: Promise<T>
  resolve: T extends void ? () => void : (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}

export function createDeferred<T = void>(): Deferred<T> {
  let resolve!: Deferred<T>['resolve']
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = once(res) as unknown as Deferred<T>['resolve']
    reject = once(rej)
  })

  return { promise, resolve, reject }
}
