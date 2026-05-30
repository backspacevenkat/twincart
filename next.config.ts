import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the workspace root to THIS project — the home dir has a stray package-lock.json
// that Next would otherwise infer as the root.
const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root },
  // Static export for AWS Amplify hosting (current app has no server routes).
  // When the Browserbase agent API route lands, remove `output: "export"` → SSR hosting.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
