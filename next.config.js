/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};
module.exports = nextConfig;
