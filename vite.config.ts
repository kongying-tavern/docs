import { path } from '@vuepress/utils'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  publicDir: path.join(__dirname, 'public'),
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    jsxInject: "import { h } from 'vue'",
  },
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'docs')}/`,
      '@utils': `${path.resolve(__dirname, 'docs/.vuepress/utils')}/`,
    },
  },
})
