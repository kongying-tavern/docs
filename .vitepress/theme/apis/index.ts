import ky from 'ky'
import sha256 from 'crypto-js/sha256'
import hmacSHA512 from 'crypto-js/hmac-sha512'
import Base64 from 'crypto-js/enc-base64'

const hmacDigest = (date) =>
  // @ts-ignore
  Base64.stringify(hmacSHA512(sha256(parseInt(date)), 'site.yuanshen'))

export const fetcher = ky.create({
  prefixUrl: 'https://kongying-tavern-feedback-api.arrebol.cc/apis/v1',
  timeout: 5000,
  retry: 0,
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
