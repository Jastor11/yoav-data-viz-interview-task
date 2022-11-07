import { fileURLToPath } from "node:url"
import * as path from "node:path"
import { createServer } from "vite"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

;(async () => {
  const server = await createServer({
    root: path.join(__dirname, "src"),
    server: {
      port: 1337,
    },
  })

  await server.listen()

  server.printUrls()
})()
