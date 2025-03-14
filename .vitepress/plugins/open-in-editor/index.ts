import type { Plugin } from 'vite'
import openEditor from 'open-editor'

export default function openInEditorPlugin(): Plugin {
  return {
    name: 'vite-plugin-open-in-editor',

    configureServer(server) {
      server.middlewares.use('/__open-in-editor', async (req, res, next) => {
        if (!req.url)
          return next()

        try {
          const params = new URL(req.url, 'http://a.com').searchParams
          const file = params.get('file')

          if (!file)
            return next()

          const line = Number.parseInt(params.get('line') || '1', 10)
          const column = Number.parseInt(params.get('column') || '1', 10)

          await openEditor([{ file, line, column }])
          res.statusCode = 204
        }
        catch (err) {
          console.error('Failed to open in editor:', err)
          res.statusCode = 500
          res.end('Failed to open in editor')
          return
        }

        res.end()
      })
    },
  }
}
