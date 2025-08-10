import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Disable telemetry for production
  experimental: {
    serverComponentsExternalPackages: ['mysql2']
  },
  
  // Image optimization for production
  images: {
    unoptimized: true
  }
};

export default nextConfig;
