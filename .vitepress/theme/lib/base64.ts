// https://github.com/evanw/thumbhash/blob/main/examples/browser/index.html
export function binaryToBase64(binary: Uint8Array) {
  return btoa(String.fromCharCode(...binary))
}
