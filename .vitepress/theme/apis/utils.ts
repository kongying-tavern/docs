/* eslint-disable node/prefer-global/process */
export function catchError<T>(
  promise: Promise<T>,
): Promise<[undefined, T] | [Error]> {
  return promise
    .then(data => [undefined, data] as [undefined, T])
    .catch(error => [error])
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
