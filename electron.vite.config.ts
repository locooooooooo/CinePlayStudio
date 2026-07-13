import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

const projectRoot = process.cwd();

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: path.resolve(projectRoot, "out/main"),
      rollupOptions: {
        input: path.resolve(projectRoot, "electron/main/index.ts"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: path.resolve(projectRoot, "out/preload"),
      rollupOptions: {
        input: path.resolve(projectRoot, "electron/preload/index.ts"),
        output: {
          format: "cjs",
          entryFileNames: "index.cjs",
        },
      },
    },
  },
  renderer: {
    root: projectRoot,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": projectRoot,
      },
    },
    build: {
      outDir: path.resolve(projectRoot, "dist/renderer"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(projectRoot, "index.html"),
      },
    },
  },
});
