import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // External packages for server components (updated for Next.js 15)
  serverExternalPackages: ['mysql2'],
  
  // Image optimization for production
  images: {
    unoptimized: true
  }
};

export default nextConfig;
