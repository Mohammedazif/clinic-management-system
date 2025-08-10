import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // External packages for server components (updated for Next.js 15)
  serverExternalPackages: ['mysql2'],
  
  // Image optimization for production
  images: {
    unoptimized: true
  },
  
  // Disable TypeScript errors during build for Railway deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
