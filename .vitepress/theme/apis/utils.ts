import type { KyResponse } from 'ky'

export const catchError = <T>(
  promise: Promise<T>,
): Promise<[undefined, T] | [Error]> => {
  return promise
    .then((data) => [undefined, data] as [undefined, T])
    .catch((error) => [error])
}

export function asyncOnce(cb: (...args: any[]) => Promise<any>) {
  const map: Record<string, null | Promise<any>> = {}
  return (...args: any[]) => {
    const key = JSON.stringify(args)
    return (map[key] ??= new Promise((resolve, reject) => {
      cb(...args)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          map[key] = null
        })
    }))
  }
}

export function getGiteePaginationParams(response: KyResponse) {
  return {
    total: Number(response.headers.get('Total_count')!),
    totalPage: Number(response.headers.get('Total_page')!),
  }
}
