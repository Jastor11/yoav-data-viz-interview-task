import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    root: "src",
    define: {
      __ENV__: env.APP_ENV,
    },
  }
})
