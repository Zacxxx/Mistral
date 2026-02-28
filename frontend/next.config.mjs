/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  output: 'standalone',
  experimental: {
    appDir: true
  }
};

export default nextConfig;