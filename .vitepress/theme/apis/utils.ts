/* eslint-disable node/prefer-global/process */
export function catchError<T>(
  promise: Promise<T>,
): Promise<[undefined, T] | [Error]> {
  return promise
    .then(data => [undefined, data] as [undefined, T])
    .catch(error => [error])
}

export function removeTrailingSlash(str: string) {
  if (str.endsWith('/')) {
    return str.slice(0, -1)
  }
  return str
}

export function asyncOnce<T extends unknown[], R>(cb: (...args: T) => Promise<R>) {
  const map: Record<string, null | Promise<R>> = {}
  return (...args: T) => {
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

export function getHeader(
  response: Response,
  headerNameList: string[],
): [undefined, Error] | [string[], undefined] {
  const result: string[] = []

  for (const headerName of headerNameList) {
    const val = response.headers.get(headerName)
    if (!val || Number.isNaN(Number(val))) {
      console.warn(`Invalid or missing header: ${headerName}`)
      return [undefined, new Error(`Invalid or missing header: ${headerName}`)]
    }
    result.push(val)
  }

  return [result, undefined]
}

export function buildFormData<T extends object>(body: T): FormData {
  const form = new FormData()
  for (const key in body) {
    const value = body[key]
    if (value instanceof Blob) {
      form.append(key, value)
    }
    else {
      form.append(key, String(value))
    }
  }
  return form
}

export function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null
  )
}
