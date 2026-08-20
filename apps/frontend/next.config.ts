import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8800';

const nextConfig: NextConfig = {
  output: 'standalone',
  /**
   * Reverse proxy untuk merutekan request /api/v1/:path* 
   * langsung ke backend Actix Web (http://127.0.0.1:8800/api/v1/:path*)
   */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
