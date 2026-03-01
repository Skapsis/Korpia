import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera una salida mínima autocontenida, ideal para contenedores Docker
  output: 'standalone',
};

export default nextConfig;
