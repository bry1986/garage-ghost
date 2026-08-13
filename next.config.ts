import path from "path";
import type { NextConfig } from "next";

const projectRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  // This folder is its own project; pin the root so Turbopack does not
  // treat the parent directory (which contains an unrelated package.json)
  // as a workspace root.
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
  // Basic security hardening for every route. A full CSP is intentionally
  // omitted: the app ships an inline theme script and static JSON-LD, which
  // would need script hashes/nonces — revisit if a CSP is ever required.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
