import { path } from '@vuepress/utils'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { join } from 'path'

export default defineConfig({
  base: 'docs',
  plugins: [vue()],
  publicDir: path.join(__dirname, 'public'),
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: "import { h } from 'vue'",
  },
  resolve: {
    alias: [
      {
        find: /~(.+)/,
        replacement: join(process.cwd(), 'node_modules/$1'),
      },

      {
        find: /@\//,
        replacement: join(process.cwd(), './src/renderer') + '/',
      },
    ],
  },
})
