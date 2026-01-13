/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@platform/sdk', '@platform/types'],
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
