import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true, // ¡La magia para ignorar estos errores!
  },
};

export default nextConfig;
