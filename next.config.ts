import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir que Electron (127.0.0.1) acceda al dev server
  allowedDevOrigins: ["http://127.0.0.1:3000", "http://localhost:3000"],
};

export default nextConfig;
