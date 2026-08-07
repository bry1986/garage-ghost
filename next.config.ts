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
};

export default nextConfig;
