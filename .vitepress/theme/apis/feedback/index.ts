import Base64 from 'crypto-js/enc-base64'
import hmacSHA512 from 'crypto-js/hmac-sha512'
import sha256 from 'crypto-js/sha256'
import ky from 'ky'

const hmacDigest = (date) =>
  // @ts-ignore
  Base64.stringify(hmacSHA512(sha256(Number.parseInt(date)), 'site.yuanshen'))

export const fetcher = ky.create({
  prefixUrl: 'https://doc-apis.yuanshen.site/apis/v1',
  timeout: 5000,
  retry: 1,
  hooks: {
    beforeRequest: [
      (request) => {
        const currently = Date.now()
        request.headers.set(
          'authorization',
          `${currently}:${hmacDigest(currently)}`,
        )
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        console.log(response)
      },
    ],
  },
})
