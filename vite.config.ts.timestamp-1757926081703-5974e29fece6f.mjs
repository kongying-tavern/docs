// vite.config.ts
import { fileURLToPath } from "node:url";
import { FontaineTransform } from "file:///D:/Code/kongying-tavern/docs-main/docs/node_modules/.pnpm/fontaine@0.5.0/node_modules/fontaine/dist/index.mjs";
import UnoCSS from "file:///D:/Code/kongying-tavern/docs-main/docs/node_modules/.pnpm/unocss@66.1.0-beta.12_postc_c8864aaf5c6e993447168ea268b154fe/node_modules/unocss/dist/vite.mjs";
import { defineConfig } from "file:///D:/Code/kongying-tavern/docs-main/docs/node_modules/.pnpm/vite@6.3.2_@types+node@22.1_455b51569644b372153e3e5db251d6ca/node_modules/vite/dist/node/index.js";
import Inspect from "file:///D:/Code/kongying-tavern/docs-main/docs/node_modules/.pnpm/vite-plugin-inspect@0.8.9_r_72459e6108d448b4cd1da79c0b1a42e6/node_modules/vite-plugin-inspect/dist/index.mjs";

// .vitepress/plugins/open-in-editor/index.ts
import openEditor from "file:///D:/Code/kongying-tavern/docs-main/docs/node_modules/.pnpm/open-editor@5.1.0/node_modules/open-editor/index.js";
function openInEditorPlugin() {
  return {
    name: "vite-plugin-open-in-editor",
    configureServer(server) {
      server.middlewares.use("/__open-in-editor", async (req, res, next) => {
        if (!req.url)
          return next();
        try {
          const params = new URL(req.url, "http://a.com").searchParams;
          const file = params.get("file");
          if (!file)
            return next();
          const line = Number.parseInt(params.get("line") || "1", 10);
          const column = Number.parseInt(params.get("column") || "1", 10);
          await openEditor([{ file, line, column }]);
          res.statusCode = 204;
        } catch (err) {
          console.error("Failed to open in editor:", err);
          res.statusCode = 500;
          res.end("Failed to open in editor");
          return;
        }
        res.end();
      });
    }
  };
}

// vite.config.ts
import vueDevTools from "file:///D:/Code/kongying-tavern/docs-main/docs/node_modules/.pnpm/vite-plugin-vue-devtools@8._bb800974c0c2eaaafdb43955ca254398/node_modules/vite-plugin-vue-devtools/dist/vite.js";
var __vite_injected_original_import_meta_url = "file:///D:/Code/kongying-tavern/docs-main/docs/vite.config.ts";
var vite_config_default = defineConfig({
  server: {
    host: true,
    fs: {
      allow: ["../.."]
    }
  },
  resolve: {
    alias: [
      {
        find: /^.*\/VPFooter\.vue$/,
        replacement: fileURLToPath(
          new URL("./.vitepress/theme/components/Footer.vue", __vite_injected_original_import_meta_url)
        )
      },
      {
        find: "@",
        replacement: fileURLToPath(
          new URL("./.vitepress/theme", __vite_injected_original_import_meta_url)
        )
      },
      {
        find: "~",
        replacement: fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    ]
  },
  plugins: [
    // https://github.com/antfu/unocss
    UnoCSS(),
    // https://github.com/unjs/fontaine
    FontaineTransform.vite({
      fallbacks: [
        "BlinkMacSystemFont",
        "Segoe UI",
        "Helvetica Neue",
        "Arial",
        "Noto Sans"
      ],
      resolvePath: (id) => new URL(`./public/fonts/${id}`, __vite_injected_original_import_meta_url)
    }),
    openInEditorPlugin(),
    Inspect(),
    vueDevTools()
    // llmstxt({
    //   workDir: 'zh',
    // }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },
  json: {
    stringify: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiLnZpdGVwcmVzcy9wbHVnaW5zL29wZW4taW4tZWRpdG9yL2luZGV4LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcQ29kZVxcXFxrb25neWluZy10YXZlcm5cXFxcZG9jcy1tYWluXFxcXGRvY3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXENvZGVcXFxca29uZ3lpbmctdGF2ZXJuXFxcXGRvY3MtbWFpblxcXFxkb2NzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Db2RlL2tvbmd5aW5nLXRhdmVybi9kb2NzLW1haW4vZG9jcy92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCB7IEZvbnRhaW5lVHJhbnNmb3JtIH0gZnJvbSAnZm9udGFpbmUnXG5pbXBvcnQgVW5vQ1NTIGZyb20gJ3Vub2Nzcy92aXRlJ1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCBJbnNwZWN0IGZyb20gJ3ZpdGUtcGx1Z2luLWluc3BlY3QnXG5pbXBvcnQgb3BlbkluRWRpdG9yIGZyb20gJy4vLnZpdGVwcmVzcy9wbHVnaW5zL29wZW4taW4tZWRpdG9yJ1xuaW1wb3J0IHZ1ZURldlRvb2xzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1kZXZ0b29scydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogdHJ1ZSxcbiAgICBmczoge1xuICAgICAgYWxsb3c6IFsnLi4vLi4nXSxcbiAgICB9LFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IFtcbiAgICAgIHtcbiAgICAgICAgZmluZDogL14uKlxcL1ZQRm9vdGVyXFwudnVlJC8sXG4gICAgICAgIHJlcGxhY2VtZW50OiBmaWxlVVJMVG9QYXRoKFxuICAgICAgICAgIG5ldyBVUkwoJy4vLnZpdGVwcmVzcy90aGVtZS9jb21wb25lbnRzL0Zvb3Rlci52dWUnLCBpbXBvcnQubWV0YS51cmwpLFxuICAgICAgICApLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZmluZDogJ0AnLFxuICAgICAgICByZXBsYWNlbWVudDogZmlsZVVSTFRvUGF0aChcbiAgICAgICAgICBuZXcgVVJMKCcuLy52aXRlcHJlc3MvdGhlbWUnLCBpbXBvcnQubWV0YS51cmwpLFxuICAgICAgICApLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgZmluZDogJ34nLFxuICAgICAgICByZXBsYWNlbWVudDogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgICAgfSxcbiAgICBdLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3Vub2Nzc1xuICAgIFVub0NTUygpLFxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3VuanMvZm9udGFpbmVcbiAgICBGb250YWluZVRyYW5zZm9ybS52aXRlKHtcbiAgICAgIGZhbGxiYWNrczogW1xuICAgICAgICAnQmxpbmtNYWNTeXN0ZW1Gb250JyxcbiAgICAgICAgJ1NlZ29lIFVJJyxcbiAgICAgICAgJ0hlbHZldGljYSBOZXVlJyxcbiAgICAgICAgJ0FyaWFsJyxcbiAgICAgICAgJ05vdG8gU2FucycsXG4gICAgICBdLFxuICAgICAgcmVzb2x2ZVBhdGg6IGlkID0+IG5ldyBVUkwoYC4vcHVibGljL2ZvbnRzLyR7aWR9YCwgaW1wb3J0Lm1ldGEudXJsKSxcbiAgICB9KSxcbiAgICBvcGVuSW5FZGl0b3IoKSxcbiAgICBJbnNwZWN0KCksXG4gICAgdnVlRGV2VG9vbHMoKSxcbiAgICAvLyBsbG1zdHh0KHtcbiAgICAvLyAgIHdvcmtEaXI6ICd6aCcsXG4gICAgLy8gfSksXG4gIF0sXG4gIGNzczoge1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgYXBpOiAnbW9kZXJuLWNvbXBpbGVyJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAganNvbjoge1xuICAgIHN0cmluZ2lmeTogdHJ1ZSxcbiAgfSxcbn0pXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXENvZGVcXFxca29uZ3lpbmctdGF2ZXJuXFxcXGRvY3MtbWFpblxcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxccGx1Z2luc1xcXFxvcGVuLWluLWVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcQ29kZVxcXFxrb25neWluZy10YXZlcm5cXFxcZG9jcy1tYWluXFxcXGRvY3NcXFxcLnZpdGVwcmVzc1xcXFxwbHVnaW5zXFxcXG9wZW4taW4tZWRpdG9yXFxcXGluZGV4LnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Db2RlL2tvbmd5aW5nLXRhdmVybi9kb2NzLW1haW4vZG9jcy8udml0ZXByZXNzL3BsdWdpbnMvb3Blbi1pbi1lZGl0b3IvaW5kZXgudHNcIjtpbXBvcnQgdHlwZSB7IFBsdWdpbiB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgb3BlbkVkaXRvciBmcm9tICdvcGVuLWVkaXRvcidcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gb3BlbkluRWRpdG9yUGx1Z2luKCk6IFBsdWdpbiB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3ZpdGUtcGx1Z2luLW9wZW4taW4tZWRpdG9yJyxcblxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9fX29wZW4taW4tZWRpdG9yJywgYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG4gICAgICAgIGlmICghcmVxLnVybClcbiAgICAgICAgICByZXR1cm4gbmV4dCgpXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMKHJlcS51cmwsICdodHRwOi8vYS5jb20nKS5zZWFyY2hQYXJhbXNcbiAgICAgICAgICBjb25zdCBmaWxlID0gcGFyYW1zLmdldCgnZmlsZScpXG5cbiAgICAgICAgICBpZiAoIWZpbGUpXG4gICAgICAgICAgICByZXR1cm4gbmV4dCgpXG5cbiAgICAgICAgICBjb25zdCBsaW5lID0gTnVtYmVyLnBhcnNlSW50KHBhcmFtcy5nZXQoJ2xpbmUnKSB8fCAnMScsIDEwKVxuICAgICAgICAgIGNvbnN0IGNvbHVtbiA9IE51bWJlci5wYXJzZUludChwYXJhbXMuZ2V0KCdjb2x1bW4nKSB8fCAnMScsIDEwKVxuXG4gICAgICAgICAgYXdhaXQgb3BlbkVkaXRvcihbeyBmaWxlLCBsaW5lLCBjb2x1bW4gfV0pXG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDRcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gb3BlbiBpbiBlZGl0b3I6JywgZXJyKVxuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwXG4gICAgICAgICAgcmVzLmVuZCgnRmFpbGVkIHRvIG9wZW4gaW4gZWRpdG9yJylcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIHJlcy5lbmQoKVxuICAgICAgfSlcbiAgICB9LFxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThTLFNBQVMscUJBQXFCO0FBQzVVLFNBQVMseUJBQXlCO0FBQ2xDLE9BQU8sWUFBWTtBQUNuQixTQUFTLG9CQUFv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
