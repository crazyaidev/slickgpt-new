import { rm } from "node:fs/promises"
import path from "node:path"

const nextDevDir = path.join(process.cwd(), ".next", "dev")

try {
  // Clear only regenerated dev output so stale manifests do not survive restarts.
  await rm(nextDevDir, {
    force: true,
    maxRetries: 10,
    recursive: true,
    retryDelay: 100,
  })
} catch (error) {
  if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
    console.warn(`[clean:next-dev] Unable to remove ${nextDevDir}: ${error.message}`)
  }
}
