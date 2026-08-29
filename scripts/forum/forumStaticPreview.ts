import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'
import process from 'node:process'

const DIST = resolve(process.cwd(), 'dist')
const portArg = process.argv.indexOf('--port')
const port = Number(portArg >= 0 ? process.argv[portArg + 1] : 5190)

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

const ROOT_FORUM_PATH_REGEX = /^\/docs\/feedback(?:\/.*)?$/
const EN_FORUM_PATH_REGEX = /^\/docs\/en\/feedback(?:\/.*)?$/
const JA_FORUM_PATH_REGEX = /^\/docs\/ja\/feedback(?:\/.*)?$/

const server = createServer((request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname
  const target = resolveRequest(pathname)

  response.statusCode = target.status
  response.setHeader('Content-Type', CONTENT_TYPES[extname(target.file)] || 'application/octet-stream')
  createReadStream(target.file).pipe(response)
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Forum static preview http://127.0.0.1:${port}/docs/\n`)
})

function resolveRequest(pathname: string): { file: string, status: number } {
  const forumShell = forumShellFor(pathname)
  if (forumShell)
    return { file: join(DIST, forumShell), status: 200 }

  const relative = pathname.startsWith('/docs/') ? pathname.slice('/docs/'.length) : ''
  const candidates = [relative, `${relative}.html`, join(relative, 'index.html')]
  for (const candidate of candidates) {
    const file = resolve(DIST, candidate)
    if (file.startsWith(`${DIST}${sep}`) && existsSync(file) && statSync(file).isFile())
      return { file, status: 200 }
  }

  return { file: join(DIST, '404.html'), status: 404 }
}

function forumShellFor(pathname: string): string | null {
  if (EN_FORUM_PATH_REGEX.test(pathname))
    return 'en/feedback.html'
  if (JA_FORUM_PATH_REGEX.test(pathname))
    return 'ja/feedback.html'
  if (ROOT_FORUM_PATH_REGEX.test(pathname))
    return 'feedback.html'
  return null
}
