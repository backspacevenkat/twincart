import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin the workspace root to THIS project — the home dir has a stray package-lock.json
// that Next would otherwise infer as the root.
const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root },
  // Static export for AWS Amplify/S3+CloudFront hosting (no server routes yet).
  // When the Browserbase agent API route lands, switch this piece to SSR hosting.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
