import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir o servidor de desenvolvimento por outros aparelhos da rede local (tablet, outro PC)
  allowedDevOrigins: ["192.168.1.28", "192.168.*.*", "10.*.*.*"],
  cacheComponents: true,
  partialPrefetching: true,
  // Ilustrações, fotos e modelos 3D ficam no aparelho por 1 semana (renovados em segundo plano):
  // o app abre muito mais rápido da segunda vez em diante, inclusive no tablet.
  async headers() {
    const cache = [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=2592000" }];
    return ["/arte/:caminho*", "/fotos/:caminho*", "/modelos/:caminho*"].map((source) => ({ source, headers: cache }));
  },
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
