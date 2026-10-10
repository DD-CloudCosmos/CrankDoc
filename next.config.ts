import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-lib'],
  outputFileTracingIncludes: {
    '/api/garage/files': ['node_modules/pdf-lib/cjs/**/*', 'node_modules/pdf-lib/package.json', 'node_modules/@pdf-lib/**/*', 'node_modules/pako/**/*', 'node_modules/tslib/**/*'],
  },
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
  ],
};

export default nextConfig;
