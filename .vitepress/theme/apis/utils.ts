import type { KyResponse } from 'ky'

export const catchError = <T>(
  promise: Promise<T>,
): Promise<[undefined, T] | [Error]> => {
  return promise
    .then((data) => [undefined, data] as [undefined, T])
    .catch((error) => [error])
}

export const removeTrailingSlash = (str: string) => {
  if (str.endsWith('/')) {
    return str.slice(0, -1)
  }
  return str
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

export const getHeader = (
  response: Response,
  headerNameList: string[],
): [undefined, Error] | [string[], undefined] => {
  let result: string[] = []

  for (const headerName of headerNameList) {
    const val = response.headers.get(headerName)
    if (!val || isNaN(Number(val))) {
      console.warn(`Invalid or missing header: ${headerName}`)
      return [undefined, new Error(`Invalid or missing header: ${headerName}`)]
    }
    result.push(val)
  }

  return [result, undefined]
}
