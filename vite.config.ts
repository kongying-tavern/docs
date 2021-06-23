import { path } from "@vuepress/utils";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: path.join(__dirname, "public"),
  resolve: {
    alias: {
      "~/": `${path.resolve(__dirname, "docs")}/`,
    },
  },
});
