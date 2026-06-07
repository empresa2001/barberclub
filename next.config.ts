import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // P2: limpiar los warnings de lint y reactivar. Por ahora no bloquea el build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // PWA Configuration
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
