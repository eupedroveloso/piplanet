import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir o servidor de desenvolvimento por outros aparelhos da rede local (tablet, outro PC)
  allowedDevOrigins: ["192.168.1.28", "192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
